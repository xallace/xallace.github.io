#!/usr/bin/env python3
"""
generate_bilingual.py - Automated AI Bilingual Story & Vocabulary Generator
Generates sentence-aligned parallel stories (e.g. DE <-> UK) with vocabulary annotations
and exports to HTML Reader, Markdown, and Anki CSV.

Author: Walter Lehn (@xallace)
Part of: xallace.github.io / Lingua AI
"""

import sys
import json
import argparse
from typing import List, Dict, Any

# Example Sentence-Aligned Story Data
DEMO_STORY = {
    "title_de": "Die Werkstatt der Träume",
    "title_uk": "Майстерня мрій",
    "level": "A2-B1",
    "languages": ["de", "uk"],
    "sentences": [
        {
            "id": 1,
            "de": "An einem klaren Frühlingsmorgen öffnete Taras die Tore seiner kleinen Werkstatt in Lwiw.",
            "uk": "Ясного весняного ранку Тарас відчинив ворота своєї маленької майстерні у Львові.",
            "vocab": [
                {"de": "der Frühlingsmorgen", "uk": "весняний ранок", "pos": "Nomen", "note": "Genitiv der Zeit"},
                {"de": "die Werkstatt", "uk": "майстерня", "pos": "Nomen", "note": "weiblich"}
            ]
        },
        {
            "id": 2,
            "de": "Der Duft von frischem Kaffee und Maschinenöl lag vertraut in der Luft.",
            "uk": "Знайомий аромат свіжої кави та машинного мастила витав у повітрі.",
            "vocab": [
                {"de": "der Duft / das Aroma", "uk": "аромат / запах", "pos": "Nomen"},
                {"de": "das Maschinenöl", "uk": "машинне мастило", "pos": "Nomen"}
            ]
        },
        {
            "id": 3,
            "de": "Auf der Werkbank lagen detaillierte Zeichnungen eines neuen, leichten Rahmens.",
            "uk": "На верстаку лежали детальні креслення нової, легкої рами.",
            "vocab": [
                {"de": "die Werkbank", "uk": "верстак", "pos": "Nomen"},
                {"de": "die Zeichnung", "uk": "креслення", "pos": "Nomen", "note": "oft im Plural"}
            ]
        },
        {
            "id": 4,
            "de": "Sein Kollege Lukas aus Stuttgart schaltete den 3D-Drucker ein und prüfte die Toleranzen.",
            "uk": "Його колега Лукас зі Штутгарта увімкнув 3D-принтер і перевірив допуски.",
            "vocab": [
                {"de": "einschalten", "uk": "увімкнути", "pos": "Verb", "note": "vollendeter Aspekt"},
                {"de": "die Toleranz", "uk": "допуск", "pos": "Nomen", "note": "technische Maßabweichung"}
            ]
        },
        {
            "id": 5,
            "de": "„Präzision ist die halbe Miete“, scherzte Lukas auf Deutsch, während er eine Schraube anzog.",
            "uk": "«Точність — це половина успіху», — пожартував Лукас німецькою, затягуючи гвинт.",
            "vocab": [
                {"de": "die Präzision", "uk": "точність", "pos": "Nomen"},
                {"de": "die Schraube", "uk": "гвинт", "pos": "Nomen"}
            ]
        },
        {
            "id": 6,
            "de": "Taras lächelte und antwortete auf Ukrainisch: „Und Geduld ist der Schlüssel zur Meisterschaft!“",
            "uk": "Тарас усміхнувся і відповів українською: «А терпіння — ключ до майстерності!»",
            "vocab": [
                {"de": "die Geduld", "uk": "терпіння", "pos": "Nomen"},
                {"de": "die Meisterschaft", "uk": "майстерність", "pos": "Nomen"}
            ]
        },
        {
            "id": 7,
            "de": "Gemeinsam testeten sie den elektrischen Antrieb auf dem unebenen Kopfsteinpflaster.",
            "uk": "Разом вони випробували електричний привід на нерівній бруківці.",
            "vocab": [
                {"de": "der Antrieb", "uk": "привід", "pos": "Nomen"},
                {"de": "das Kopfsteinpflaster", "uk": "бруківка", "pos": "Nomen"}
            ]
        },
        {
            "id": 8,
            "de": "Der Motor summte leise, und das Zahnrad griff ohne das geringste Spiel.",
            "uk": "Двигун тихо гудів, і шестерня зчіплювалася без найменшого люфту.",
            "vocab": [
                {"de": "das Zahnrad", "uk": "шестерня", "pos": "Nomen"},
                {"de": "das Spiel / der Spielraum", "uk": "люфт", "pos": "Nomen", "note": "mechanisches Spiel"}
            ]
        },
        {
            "id": 9,
            "de": "Die Nachbarskinder blieben staunend stehen und winkten den beiden Erfindern zu.",
            "uk": "Діти сусідів зупинилися від подиву та помахали обом винахідникам.",
            "vocab": [
                {"de": "staunend", "uk": "з подивом", "pos": "Adverb"},
                {"de": "der Erfinder", "uk": "винахідник", "pos": "Nomen"}
            ]
        },
        {
            "id": 10,
            "de": "In diesem Moment verstanden beide, dass Technik und Sprache Brücken zwischen Menschen bauen.",
            "uk": "У цей момент обидва зрозуміли, що техніка та мова будують мости між людьми.",
            "vocab": [
                {"de": "die Brücke", "uk": "міст (мн. мости)", "pos": "Nomen"},
                {"de": "bauen", "uk": "будувати", "pos": "Verb"}
            ]
        }
    ]
}

SYSTEM_PROMPT = """
You are an expert bilingual computational linguist. Create a sentence-aligned parallel story for language learning.
Return ONLY valid JSON matching this schema:

{
  "title_de": "Titel auf Deutsch",
  "title_uk": "Назва українською",
  "level": "A2-B1",
  "sentences": [
    {
      "id": 1,
      "de": "Deutscher Satz 1.",
      "uk": "Ukrainischer Satz 1.",
      "vocab": [
        {"de": "Wort", "uk": "Слово", "pos": "Nomen/Verb/Adj", "note": "Grammatik-Hinweis"}
      ]
    }
  ]
}

Rules:
1. Strict 1-to-1 sentence alignment. Each sentence in language A corresponds precisely to sentence in language B.
2. Natural, authentic phrasing on CEFR level.
3. Extract 2-3 key vocabulary terms per sentence with grammatical annotations.
"""

def export_markdown(data: Dict[str, Any], output_path: str):
    """Exports bilingual story to side-by-side and interlinear Markdown."""
    lines = [
        f"# {data['title_de']} · {data['title_uk']}",
        f"**Niveau:** {data.get('level', 'A2-B1')} | **Sprachen:** Deutsch ↔ Ukrainisch\n",
        "## Paralleler Lesetext (Interlinear / Satz für Satz)\n"
    ]
    
    for s in data["sentences"]:
        lines.append(f"**[{s['id']}]** 🇩🇪 {s['de']}")
        lines.append(f"&nbsp;&nbsp;&nbsp;&nbsp; 🇺🇦 *{s['uk']}*\n")
        if s.get("vocab"):
            vocab_str = " · ".join([f"**{v['de']}** = {v['uk']} ({v.get('pos','')})" for v in s["vocab"]])
            lines.append(f"> 📖 *Vokabeln:* {vocab_str}\n")
            
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[+] Markdown exportiert: {output_path}")

def export_anki_csv(data: Dict[str, Any], output_path: str):
    """Exports to Anki Flashcard CSV (Front: Ukrainian, Back: German + Vocab)."""
    lines = ["#separator:tab", "#html:true", "#tags column:3"]
    for s in data["sentences"]:
        front = f"<div style='font-size:18px; color:#0284c7;'>{s['uk']}</div>"
        back = f"<div style='font-size:18px; color:#1e293b; font-weight:bold;'>{s['de']}</div>"
        if s.get("vocab"):
            v_list = "".join([f"<li><b>{v['uk']}</b>: {v['de']} <small>({v.get('pos','')})</small></li>" for v in s["vocab"]])
            back += f"<hr/><ul style='text-align:left; font-size:14px;'>{v_list}</ul>"
        tags = f"lingua-ai {data.get('level','A2')}"
        lines.append(f"{front}\t{back}\t{tags}")
        
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[+] Anki CSV exportiert: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Lingua AI: Bilingual Story & Vocabulary Generator")
    parser.add_argument("--export-md", default="bilingual_story.md", help="Export Markdown Pfad")
    parser.add_argument("--export-anki", default="bilingual_anki.tsv", help="Export Anki TSV Pfad")
    parser.add_argument("--print-prompt", action="store_true", help="System Prompt für LLMs ausgeben")
    args = parser.parse_args()

    if args.print_prompt:
        print("\n=== SYSTEM PROMPT FÜR LLM GENERIERUNG ===")
        print(SYSTEM_PROMPT)
        return

    export_markdown(DEMO_STORY, args.export_md)
    export_anki_csv(DEMO_STORY, args.export_anki)
    print("\n[✓] Generierung erfolgreich abgeschlossen!")

if __name__ == "__main__":
    main()
