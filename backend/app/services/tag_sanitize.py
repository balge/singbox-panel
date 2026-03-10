"""Sanitize fragment to valid sing-box tag: remove emoji, replace special chars with _."""
import re
import unicodedata

# Chars to replace with underscore (sing-box tag should be safe)
REPLACE_CHARS = ".|\\/:*?\"<>"
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001f926-\U0001f937"
    "\U00010000-\U0010ffff"
    "]+",
    flags=re.UNICODE,
)


def sanitize_tag(fragment: str) -> str:
    if not fragment or not isinstance(fragment, str):
        return "node"
    # Remove emoji and other symbols
    s = EMOJI_PATTERN.sub("", fragment)
    # Normalize unicode (e.g. fullwidth to ascii)
    s = unicodedata.normalize("NFKC", s)
    for c in REPLACE_CHARS:
        s = s.replace(c, "_")
    # Collapse multiple underscores, strip
    s = re.sub(r"_+", "_", s).strip("_")
    return s if s else "node"
