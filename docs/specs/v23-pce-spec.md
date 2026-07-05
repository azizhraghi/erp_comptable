# Specification: V23 - Module Plan Comptable (PCE)

## Objective
Implement a robust Plan Comptable Tunisien (PCE) module that allows users to manage accounts, search by class/number, and prepares the ground for accounting mapping (NEF/Fiscal).

## Features
1. **Data Structure**:
    - `state.pce`: Array of account objects.
    - Account Object: `{ id, numero, libelle, classe, type, nature_solde, lettrable, rapprochable, cycle_audit, active }`.
2. **UI Component**:
    - List view with search and filters (by Class 1-7).
    - Modal for adding/editing accounts.
    - Preloaded data (Official 524 accounts).
3. **Integration**:
    - Link the sidebar "Plan Comptable" to this new view.
    - Ensure persistence in `state`.

## Design (Aesthetics)
- Clean table with sticky headers.
- Badge system for account types (Actif, Passif, Charge, Produit).
- Search bar with instant filtering.

## Data Preloading
Inject the official SYSCOHADA classes and main accounts as a starting point.
