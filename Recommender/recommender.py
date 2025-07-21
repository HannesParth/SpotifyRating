import pandas as pd
import numpy as np
import ast
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from typing import List, Dict, Optional,Any
import warnings
import random
import json
import re

def parse_sections_start(x):
    if isinstance(x, str) and x.startswith("[") and "]" in x:
        try:
            # Remove brackets, split by whitespace
            nums = x.strip("[]").split()
            # Convert to float
            return [float(n) for n in nums]
        except Exception as e:
            return []
    return x if isinstance(x, list) else []

warnings.filterwarnings("ignore")

# === File path ===
SONG_DATA_PATH = "msd_processed.csv"

# === Load and clean CSV ===
df = pd.read_csv(SONG_DATA_PATH)
df["sections_start"] = df["sections_start"].apply(parse_sections_start)

LIST_COLUMNS = [
    'segments_loudness_max', 'segments_loudness_max_time', 'segments_loudness_start',
    'segments_pitches', 'segments_timbre',
    'segments_start',
    'sections_start'
]


def safe_literal_eval(val):
    try:
        if val is None:
            return []
        if isinstance(val, float) and pd.isna(val):
            return []
        if isinstance(val, str) and val.startswith('['):
            return ast.literal_eval(val)
        return val  # already parsed or not a list-like string
    except Exception as e:
        return []

for col in LIST_COLUMNS:
    if col in df.columns:
        df[col] = df[col].apply(safe_literal_eval)

# === Feature columns ===
AUDIO_FEATURE_COLUMNS = [
    'danceability', 'energy', 'time_signature', 'loudness',
    'song_hotttnesss', 'tempo', 'duration'
]

SEGMENT_COLUMNS = [
    'segments_loudness_max', 'segments_loudness_max_time', 'segments_loudness_start',
    'segments_pitches', 'segments_timbre'
]

df['duration_raw'] = df['duration']

# === Normalize audio features ===
scaler = MinMaxScaler()
df[AUDIO_FEATURE_COLUMNS] = scaler.fit_transform(df[AUDIO_FEATURE_COLUMNS])
df[AUDIO_FEATURE_COLUMNS] = df[AUDIO_FEATURE_COLUMNS].fillna(0)


# === Utility Functions ===

def get_song_by_id(track_id: str) -> Optional[pd.Series]:
    match = df[df['track_id'] == track_id]
    return match.iloc[0] if not match.empty else None


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
    missing_tracks = []

    for entry in feedback:
        track_id = entry['track_id']
        song = get_song_by_id(track_id)

        if song is None:
            missing_tracks.append(track_id)
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

    if missing_tracks:
        print(
            f"[WARN] {len(missing_tracks)} feedback track(s) not found in dataset:")
        for tid in missing_tracks:
            print(f"  - Missing track_id: {tid}")

    if not weighted_vectors:
        print("[WARN] No usable feedback vectors — returning None")
        return None

    avg_vector = np.average(weighted_vectors, axis=0, weights=weights)
    norm = np.linalg.norm(avg_vector)
    return avg_vector / norm if norm > 0 else avg_vector

def recommend_next_song(feedback: List[Dict]) -> Optional[str]:
    user_vec = apply_feedback(feedback)

    if user_vec is None or np.isnan(user_vec).any():
        print("[INFO] No valid user vector for recommendation")
        # fallback to random unrated song as before
        unrated = df[~df['track_id'].isin(
            {entry['track_id'] for entry in feedback})]
        if not unrated.empty:
            print("[INFO] Returning random unrated song because no valid user vector.")
            return unrated.sample(1).iloc[0]['track_id']
        print(
            "[INFO] No recommendation could be made — dataset exhausted or empty feedback.")
        return None

    feature_matrix = df[AUDIO_FEATURE_COLUMNS].to_numpy(dtype=np.float32)
    if np.isnan(feature_matrix).any():
        print("[WARN] Feature matrix contains NaNs, replacing with zeros")
        feature_matrix = np.nan_to_num(feature_matrix)

    if user_vec.shape[0] != feature_matrix.shape[1]:
        user_vec = user_vec[:feature_matrix.shape[1]]

    similarities = cosine_similarity([user_vec], feature_matrix)[0]

    df['similarity'] = similarities

    rated_ids = {entry['track_id'] for entry in feedback}
    candidates = df[~df['track_id'].isin(rated_ids)]

    if candidates.empty:
        print(
            "[INFO] No candidates found for recommendation after excluding rated songs.")
        return None

    top = candidates.sort_values(by='similarity', ascending=False).iloc[0]
    print(
        f"[INFO] Recommended next song: {top['track_id']} - {top['title']} by {top['artist']}")
    return top['track_id']


def get_sections_data(track_id: str) -> Dict[str, Any]:
    song = get_song_by_id(track_id)
    if song is not None and isinstance(song['sections_start'], list):
        return {
            "sections_start": song['sections_start'],
            "duration": song.get('duration_raw', 0.0)
        }
    else:
        print(f"[ERROR] Current song with track_id '{track_id}' not found in dataset.")
        return {
            "sections_start": [],
            "duration": 0.0
        }

# === Main wrapper ===

def recommend(current_track_id: str, playlist_feedback: List[Dict]) -> Dict:
    return {
        "sections_start": get_sections_data(current_track_id),
        "recommended_song": recommend_next_song(playlist_feedback)
    }

############################################################## Demo Code#############################################################
# if __name__ == "__main__":

#     def pick_random_songs(df, count=3, exclude_track_id=None):
#         candidates = df[df['track_id'] != exclude_track_id]
#         return candidates.sample(count)

#     def generate_random_feedback(songs_df):
#         feedback = []
#         for _, song in songs_df.iterrows():
#             rating = random.choice([1, -1])

#             # Add segment-level feedback with 50% chance if sections are valid
#             if isinstance(song.get('sections_start'), list) and len(song['sections_start']) > 1 and random.random() < 0.5:
#                 seg_idx = 0  # you can randomize this too
#                 seg_rate = rating
#             else:
#                 seg_idx = None
#                 seg_rate = None

#             feedback.append({
#                 "track_id": song['track_id'],
#                 "rating": rating,
#                 "segment_index": seg_idx,
#                 "segment_rating": seg_rate
#             })

#         return feedback

#     print("=== MSD Recommender CLI Demo (Fixed Song Input) ===\n")

#     # === Use fixed track_id as current song ===
#     current_track_id = "TRAXLZU12903D05F94"
#     current_song = df[df['track_id'] == current_track_id].iloc[0]

#     feedback_songs = pick_random_songs(
#         df, 3, exclude_track_id=current_track_id)
#     playlist_feedback = generate_random_feedback(feedback_songs)

#     print("\nInput:")
#     print(f" Current playing song ID: {current_track_id}")
#     print(" Cached playlist feedback:")
#     print(json.dumps(playlist_feedback, indent=4))

#     result = recommend(current_track_id, playlist_feedback)

#     print("\nOutput:")
#     print(json.dumps(result, indent=4))
