import hashlib
import html
import json
import os
import re
import feedparser

# الموقعان المصدران (يمكنك استبدال أو إضافة خلاصات RSS أخرى حسب الحاجة)
SOURCES = [
    {
        "name": "آي-فون إسلام",
        "url": "https://iphoneislam.com/feed/",
    },
    {
        "name": "أخبار أبل وآيفون",
        "url": "https://news.google.com/rss/search?q=iPhone+OR+Apple&hl=ar&gl=DZ&ceid=DZ:ar",
    },
]

QA_FILE = "qa_100.json"
HISTORY_FILE = "processed_articles.json"
MAX_QUESTIONS = 100


def load_json(path, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def make_id(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:12]


def clean_html(raw: str) -> str:
    text = html.unescape(raw or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_qa_from_entry(title: str, summary: str, link: str, source_name: str):
    clean_title = clean_html(title)
    clean_summary = clean_html(summary)

    if not clean_title:
        return []

    answer_text = clean_summary if clean_summary else f"مقال جديد من {source_name} بعنوان: {clean_title}."
    if len(answer_text) > 360:
        answer_text = answer_text[:357].rsplit(" ", 1)[0] + "..."

    question_1 = f"ما الجديد حول: {clean_title}؟"
    question_2 = f"ملخص خبر ({source_name}): {clean_title}"

    items = [
        {
            "id": make_id(question_1),
            "question": question_1,
            "answer": answer_text,
            "source": link,
            "source_name": source_name,
        },
        {
            "id": make_id(question_2),
            "question": question_2,
            "answer": answer_text,
            "source": link,
            "source_name": source_name,
        },
    ]
    return items


def main():
    existing_qa = load_json(QA_FILE, [])
    processed = set(load_json(HISTORY_FILE, []))
    seen_q_ids = {item.get("id") for item in existing_qa if item.get("id")}
    new_qa = []

    for src in SOURCES:
        feed = feedparser.parse(src["url"])
        for entry in feed.entries[:10]:
            link = (entry.get("link") or "").strip()
            title = (entry.get("title") or "").strip()
            summary = (entry.get("summary") or entry.get("description") or "").strip()
            art_id = make_id(link or title)

            if not title or art_id in processed:
                continue

            generated = build_qa_from_entry(title, summary, link, src["name"])
            for qa in generated:
                if qa["id"] not in seen_q_ids:
                    seen_q_ids.add(qa["id"])
                    new_qa.append(qa)

            processed.add(art_id)

    updated_qa = (new_qa + existing_qa)[:MAX_QUESTIONS]
    save_json(QA_FILE, updated_qa)
    save_json(HISTORY_FILE, list(processed)[-600:])
    print(f"تم الجلب والتحديث. إجمالي الأسئلة في {QA_FILE}: {len(updated_qa)}")


if __name__ == "__main__":
    main()
