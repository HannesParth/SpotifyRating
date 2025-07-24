import pandas as pd
import os
import numpy as np
import ast
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from typing import List, Dict, Optional, Any
import json
import warnings
warnings.filterwarnings("ignore")

# === CSV Dataset Path ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SONG_DATA_PATH = os.path.join(BASE_DIR, "msd_processed.csv")

# === Load CSV ===
df = pd.read_csv(SONG_DATA_PATH)

# === Helper to parse stringified lists ===


def safe_literal_eval(val):
    try:
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return []
        if isinstance(val, str) and val.startswith('['):
            return ast.literal_eval(val)
        return val
    except Exception:
        return []


# === Apply list parsing to relevant columns ===
LIST_COLUMNS = [
    'segments_loudness_max', 'segments_loudness_max_time', 'segments_loudness_start',
    'segments_pitches', 'segments_timbre', 'segments_start', 'sections_start'
]

for col in LIST_COLUMNS:
    if col in df.columns:
        df[col] = df[col].apply(safe_literal_eval)

# === Audio Feature Columns ===
AUDIO_FEATURE_COLUMNS = [
    'danceability', 'energy', 'time_signature', 'loudness',
    'song_hotttnesss', 'tempo', 'duration'
]

SEGMENT_COLUMNS = [
    'segments_loudness_max', 'segments_loudness_max_time', 'segments_loudness_start',
    'segments_pitches', 'segments_timbre'
]

# === Normalize Features ===
scaler = MinMaxScaler()
df[AUDIO_FEATURE_COLUMNS] = scaler.fit_transform(df[AUDIO_FEATURE_COLUMNS])
df[AUDIO_FEATURE_COLUMNS] = df[AUDIO_FEATURE_COLUMNS].fillna(0)

# === Utility Functions ===


def find_song(title: str, artist: str) -> Optional[pd.Series]:
    row = df[(df['title'].str.lower() == title.lower()) &
             (df['artist'].str.lower() == artist.lower())]
    return row.iloc[0] if not row.empty else None


def get_song_vector(song: pd.Series) -> np.ndarray:
    return song[AUDIO_FEATURE_COLUMNS].to_numpy(dtype=np.float32)


def compute_section_vector(song_row: pd.Series, section_index: int) -> Optional[np.ndarray]:
    section_starts = song_row.get("sections_start", [])
    if section_index >= len(section_starts):
        return None

    start_time = section_starts[section_index]
    end_time = section_starts[section_index + 1] if section_index + \
        1 < len(section_starts) else float('inf')
    segment_starts = song_row.get("segments_start", [])

    indices = [i for i, t in enumerate(
        segment_starts) if start_time <= t < end_time]
    if not indices:
        return None

    feature_vectors = []
    for i in indices:
        vec = []
        for col in SEGMENT_COLUMNS:
            values = song_row.get(col, [])
            if i < len(values):
                val = values[i]
                vec.extend(val if isinstance(val, list) else [val])
        if vec:
            feature_vectors.append(vec)

    return np.mean(feature_vectors, axis=0) if feature_vectors else None


def apply_feedback(feedback: List[Dict]) -> Optional[np.ndarray]:
    weighted_vectors = []
    weights = []
    missing_songs = []

    for entry in feedback:
        title = entry['title']
        artist = entry['artist']
        song = find_song(title, artist)

        if song is None:
            missing_songs.append(f"{title} - {artist}")
            continue

        section_index = entry.get('segment_index')
        rating = entry.get('rating', 0)
        segment_rating = entry.get('segment_rating', 0)

        full_vec = get_song_vector(song)

        if section_index is not None:
            section_vec = compute_section_vector(song, section_index)
            if section_vec is not None:
                vec = 0.7 * full_vec + 0.3 * section_vec
                weight = segment_rating
            else:
                vec = full_vec
                weight = rating
        else:
            vec = full_vec
            weight = rating

        if vec is not None and not np.isnan(vec).any():
            weighted_vectors.append(vec * weight)
            weights.append(abs(weight))

    if missing_songs:
        print(f"[WARN] Missing songs in dataset: {missing_songs}")

    if not weighted_vectors:
        print("[WARN] No usable feedback vectors — returning None")
        return None

    avg_vector = np.average(weighted_vectors, axis=0, weights=weights)
    norm = np.linalg.norm(avg_vector)
    return avg_vector / norm if norm > 0 else avg_vector


def recommend_next_song(feedback: List[Dict]) -> Optional[Dict[str, str]]:
    user_vec = apply_feedback(feedback)

    if user_vec is None or np.isnan(user_vec).any():
        unrated = df[~df.apply(lambda row: any(
            row['title'].lower() == f['title'].lower(
            ) and row['artist'].lower() == f['artist'].lower()
            for f in feedback
        ), axis=1)]
        if not unrated.empty:
            fallback = unrated.sample(1).iloc[0]
            return {"title": fallback['title'], "artist": fallback['artist']}
        return None

    feature_matrix = df[AUDIO_FEATURE_COLUMNS].to_numpy(dtype=np.float32)
    feature_matrix = np.nan_to_num(feature_matrix)

    similarities = cosine_similarity([user_vec], feature_matrix)[0]
    df['similarity'] = similarities

    rated_set = {(f['title'].lower(), f['artist'].lower()) for f in feedback}
    candidates = df[~df.apply(
        lambda row: (
            isinstance(row.get("title"), str) and
            isinstance(row.get("artist"), str) and
            (row["title"].lower(), row["artist"].lower()) in rated_set
        ),
        axis=1
    )]

    if candidates.empty:
        return None

    top = candidates.sort_values(by='similarity', ascending=False).iloc[0]
    return {"title": top['title'], "artist": top['artist']}


def get_sections_data(title: str, artist: str) -> Dict[str, Any]:
    song = find_song(title, artist)
    if song is not None and isinstance(song['sections_start'], list):
        return {
            "sections_start": song['sections_start'],
            "duration": song.get('duration', 0.0)
        }
    return {
        "sections_start": [],
        "duration": 0.0
    }

# === Entry Point ===


def recommend(current_title: str, current_artist: str, playlist_feedback: List[Dict]) -> Dict[str, Any]:
    return {
        "sections_start": get_sections_data(current_title, current_artist),
        "recommended_song": recommend_next_song(playlist_feedback)
    }

####################################################################DEMO#########################################################


# if __name__ == "__main__":
#     print("=== CLI Demo: MSD Segment-Based Recommender ===\n")

#     # Step 1: Pick a current song that definitely exists
#     current_song = df.sample(1).iloc[0]
#     current_title = current_song['title']
#     current_artist = current_song['artist']
#     print(f"Picked current song: {current_title} by {current_artist}")

#     # Step 2: Pick 3 feedback songs from MSD (excluding current)
#     feedback_candidates = df[(df['title'] != current_title) | (
#         df['artist'] != current_artist)].sample(3)
#     feedback = []

#     for _, row in feedback_candidates.iterrows():
#         seg_idx = 0
#         if isinstance(row['sections_start'], list) and len(row['sections_start']) > 1:
#             # pick section index safely
#             seg_idx = min(1, len(row['sections_start']) - 1)

#         feedback.append({
#             "title": row['title'],
#             "artist": row['artist'],
#             "rating": 1,               # Whole-song feedback
#             "segment_index": seg_idx,  # Treated as section index
#             "segment_rating": 1        # Segment-level feedback
#         })

#     # Step 3: Print input to CLI
#     print("\nInput:")
#     print(f"Current Song -> Title: {current_title}, Artist: {current_artist}")
#     print("Feedback Playlist:")
#     print(json.dumps(feedback, indent=4))

#     # Step 4: Call the main function
#     result = recommend(current_title, current_artist, feedback)

#     # Step 5: Print output
#     print("\nOutput:")
#     print(json.dumps(result, indent=4))
