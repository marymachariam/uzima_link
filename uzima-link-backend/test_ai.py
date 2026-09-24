from services.ai_service import extract_clinical_entities, translate_text

text = "Nina maumivu ya kichwa na nimekuwa na kikohozi kwa siku tatu"

translation = translate_text(text)
print("TRANSLATION:", translation)

entities = extract_clinical_entities(translation["english"])
print("ENTITIES:", entities)
