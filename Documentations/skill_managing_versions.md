# SKILL: MANAGING VERSION HISTORY — COMPTAEXPERT ERP

This skill defines the strict rules for updating the `HISTORIQUE_VERSIONS - ERP COMPTAEXPERT.txt` file.

## 1. FILE STRUCTURE
- **Header**: "HISTORIQUE DÉTAILLÉ DES VERSIONS — COMPTAEXPERT ERP"
- **Order**: Antichronological (most recent at the top).
- **Separators**: 
    - `====================` for the main header.
    - `********************` for version boundaries.
    - `--------------------` for internal section headers.

## 2. VERSION BLOCK TEMPLATE
```text
************************************************************************************************************************************
VERSION : V[Number]
DATE : [DD/MM/YYYY HH:MM]
------------------------------------------------------------------------------------------------------------------------------------
AJOUTÉ :
- [Module Name] : [Detailed description of new features].
MODIFIÉ :
- [Module Name] : [Detailed description of changes or improvements].
SUPPRIMÉ :
- [Feature] : [Reason for removal].
CORRIGÉ :
- [Bug] : [Description of the fix].
```

## 3. RULES
- **No Overwriting**: Never touch previous version history unless explicitly requested for a specific version.
- **Granularity**: Group changes by module (e.g., Tiers, Exercices, PCE).
- **Tone**: Professional and technical (French language).
- **Sync**: Must be updated immediately after any significant code change in the main HTML file.
