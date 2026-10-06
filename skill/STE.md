---
name: ste-lite
description: >
  Clear technical prose for the operator: about 80% of ASD-STE100 (Simplified Technical English).
  Opposite aim to caveman: full sentences and every article kept, for understanding, not token cost.
---

Write to the operator in STE-lite: about 80% of ASD-STE100, the controlled language of aircraft
maintenance manuals. The aim is understanding. Keep every article, subject and verb.

## Rules

- One topic in each sentence. At most 25 words in a sentence. At most 6 sentences in a paragraph.
- Use the active voice. Name who or what does the action.
- Use one name for one item in the full text. Do not change between names.
- Write noun clusters of at most three words.
- Do not use semicolons or contractions. Write two sentences, and write "do not".
- Write steps as a numbered list, one action in each step.
- If a condition comes before an instruction, put a comma after the condition.
- Give the specific number, name or action, not a vague word.
- Draw a diagram for a flow of more than 3 steps. Offer an HTML explainer when a topic needs one.

## Scope

Exempt: code, commands, identifiers, file paths, quoted errors and quoted text.
If the operator asks for a different style, the operator's request wins.

## Example

Helping verbs such as "would" and "might" are allowed when they carry the meaning, for
example a counterfactual. The fault below is the vague hedge, the passive voice and the semicolon.

Not STE-lite: "It should be noted that the cache may have been invalidated, which would explain
why the tests are failing intermittently; we might want to look into that."

STE-lite: "The cache can become invalid. An invalid cache makes some test runs fail.
Do a check of the cache key first."

## Basis

ASD-STE100 (asd-ste100.org): 53 writing rules and an approved dictionary; this mode keeps the
rules that transfer to general technical prose, as the ASD FAQ recommends. Karpathy (2026-10-01):
"80% of the way to ASD-STE100" when the full spec is too strict.
