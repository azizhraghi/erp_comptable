# Specification: V24 - Module Plan Tiers

## Objective
Implement a robust Tier Management module (Clients, Fournisseurs, Collaborateurs) that allows users to manage third-party entities, link them to the Plan Comptable (PCE), and prepare for advanced auxiliary accounting.

## Features
1. **Data Structure**:
    - `state.tiers`: Array of tier objects.
    - Tier Object: `{ id, type, compte_rattache, reference, raison_sociale, matricule_fiscal, adresse, contact, delai_paiement, actif }`.
    - Types: Client, Fournisseur, Salarié, Autre.
2. **UI Component**:
    - List view with search and filters by Type.
    - Modal for adding/editing tiers.
    - Real-time checking of linked PCE accounts (e.g., must be class 4).
3. **Integration**:
    - Link the sidebar "Plan Tiers" to this new view.
    - Ensure persistence in the `state` JSON.

## Design (Aesthetics)
- Clean, searchable table (similar to PCE).
- Color-coded badges for Tier Type (Client = Success, Fournisseur = Primary).
- Quick copy button for Matricule Fiscal.

## Business Logic (Tunisian Standard)
- Must allow setting a default payment term (Delai de paiement).
- Linking to specific collective accounts (e.g., 411000 for clients, 401000 for suppliers).
