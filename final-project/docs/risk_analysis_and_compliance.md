# Anàlisi de riscos, compliment normatiu i Model Card — SIGEA-IA

> **Nota de rigor normatiu**: Aquest document diferencia explícitament les **obligacions legals vigents** (AI Act, RGPD, LOPDGDD, ENS, LPACAP/LRJSP) de les **bones pràctiques d'enginyeria**.

## 1. Classificació regulatòria i marc normatiu vigent

1. **Reglament (UE) 2024/1689 (AI Act)**:
   - Els casos d'ús de **Serveis Socials / avaluació d'elegibilitat a prestacions públiques essencials** entren dins de l'**Annex III, punt 5.a (Alt Risc)**.
   - **Obligacions aplicables com a responsable del desplegament (*deployer* públic)**:
     - **Supervisió humana efectiva (art. 14 i art. 26)**: SIGEA-IA força `autonomous_final_decision = False` en el 100% dels casos i deriva automàticament a personal funcionari qualsevol expedient social, dubtós, anòmal o incomplet.
     - **Avaluació d'Impacte en Drets Fonamentals — FRIA (art. 27)**: obligatòria per a entitats de dret públic abans de la posada en producció de sistemes d'alt risc de l'Annex III.
     - **Transparència (art. 50)**: avís explícit d'assistència per IA en tots els esborranys generats.
     - **Conservació de registres automàtics (art. 12 i art. 26.6)**: *audit log* immutable amb cadena SHA-256 durant el mínim legal aplicable (mínim 6 mesos sota AI Act, ampliable segons calendari de conservació documental de l'administració).
2. **RGPD (Reglament (UE) 2016/679) i LOPDGDD (LO 3/2018)**:
   - **Art. 22 RGPD**: prohibició de decisions individuals únicament automatitzades amb efectes jurídics; garantit arquitectònicament per la porta HITL i el registre motivat humà.
   - **Art. 5.1.c i art. 25 RGPD (minimització i privacitat des del disseny)**: redacció automàtica de NIF, IBAN, telèfon i correu electrònic abans de persistir logs/telemetria (Pas 3).
   - **Art. 35 RGPD**: EIPD (Avaluació d'Impacte relativa a la Protecció de Dades) prèvia obligatòria amb intervenció del DPD/DPO i consulta a l'APDCAT si persisteix risc alt residual.
   - **Disposició Addicional 7a LOPDGDD**: identificació minimitzada en publicacions/notificacions públiques.
3. **Llei 39/2015 (LPACAP) i Llei 40/2015 (LRJSP)**:
   - **Art. 68 LPACAP**: generació d'esborrany de requeriment d'esmena amb termini de 10 dies hàbils quan manquen annexos obligatoris.
   - **Art. 35 LPACAP**: motivació obligatòria de les decisions administratives (el mètode `record_human_decision` rebutja motivacions buides o merament formulàries `< 15` caràcters).
   - **Art. 41 LRJSP**: qualsevol actuació administrativa automatitzada real requeriria resolució prèvia de l'òrgan competent definint especificacions, auditoria i òrgan d'impugnació; SIGEA-IA s'opera com a **suport a la tramitació**, no com a AAA resolutiva.
4. **Esquema Nacional de Seguretat — ENS (RD 311/2022)**:
   - Categorització recomanada: **MITJANA** per a tràmits generals i **ALTA** quan incorpora dades de categoria especial (Serveis Socials / salut).
   - Controls aplicats: RBAC per rols (`ALLOWED_ROLES`), contenidor Docker amb usuari no-root, integritat de registres SHA-256, tallafoc anti-*Prompt Injection* i pla de notificació de bretxes de seguretat (72 h a l'APDCAT segons art. 33 RGPD i notificació CCN-CERT/CSIRT-CAT).

## 2. Matriu de riscos i mitigacions

| ID | Risc tècnic / legal | Probabilitat | Impacte | Mitigació implementada a SIGEA-IA |
|---|---|---|---|---|
| R1 | Al·lucinació normativa o citació d'ordenança derogada (`OF-IBI-2024`) | Mitjana | Alt | Filtre temporal estricte (`vigencia == "vigent"`) abans del RAG + abstenció controlada sense cites |
| R2 | *Indirect Prompt Injection* incrustat en una instància o annex PDF | Mitjana | Crític | Tallafoc defensiu (Pas 2) + bloqueig preventiu + derivació a seguretat i no-sincronització ENI |
| R3 | Fuita de PII (NIF/IBAN) en registres de telemetria o *logs* d'auditoria | Alta | Crític | Redacció automàtica prèvia al *ledger* (Pas 3) verificada per test automatitzat (`test_04`) |
| R4 | *Automation bias* / *rubber-stamping* per part del personal revisor | Mitjana | Alt | Mostra factors explicatius locals, llindars de confiança i exigeix justificació humana explícita |
| R5 | *Starvation* d'expedients rutinaris davant urgències constants | Mitjana | Mitjà | Factor *aging* anti-*starvation* (`+1,5 punts/dia`, màx. `+30`) al Pas 9 |
| R6 | *Data drift* progressiu en imports o vocabulari ciutadà | Alta | Mitjà | Monitoratge continu de PSI (`drift_alert` si `PSI >= 0,25`) i latència P95 al Pas 12 |
| R7 | Caiguda del registre corporatiu *legacy* (ENI) | Mitjana | Alt | *Circuit Breaker* + cua persistent `eni_outbox` sense pèrdua d'expedients (Pas 13) |
| R8 | Manipulació *a posteriori* dels registres d'auditoria | Baixa | Crític | Encadenament criptogràfic `SHA-256` (`prev_hash` + `record_hash`) verificat per `verify_chain()` |

## 3. Model Card resumida (`SIGEA-IA v1.0.0`)

- **Nom i versió**: `sigea-nlp-rag-v1.0.0` / `prompt-esborrany-v1.0.0`.
- **Ús previst**: Suport a la classificació, validació documental formal, recuperació normativa vigent i priorització d'expedients d'administració local catalana.
- **Usos prohibits / fora d'abast**: Resolució administrativa autònoma, denegació automàtica d'ajuts socials, puntuació social ciutadana (*social scoring*, prohibit per art. 5 AI Act).
- **Dades de validació**: 12 expedients 100% sintètics i 6 normes sintètiques (5 vigents + 1 derogada) en català.
- **Mètriques verificades en suite automatitzada**: 15/15 tests en verd, 0% fuites de PII al *ledger*, 100% bloqueig de proves d'injecció, 0% citacions de normes derogades, 100% integritat de cadena SHA-256.
