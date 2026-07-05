---
name: creating-skills
description: Expertly generates high-quality, predictable, and efficient .agent/skills/ directories based on user requirements. This skill serves as the primary reference for creating and standardizing new skills across all projects.
---

# Creating Skills

## When to use this skill
- When the user asks to create a new skill or automate a specific task.
- When standardizing existing agent capabilities into the `.agent/skills/` structure.
- When generating helper scripts or resources for agent workflows.

## Workflow
- [ ] **Analyze Requirements**: Identify the core task, trigger keywords, and desired level of freedom (high, medium, low).
- [ ] **Set Structure**: Define the folder hierarchy (SKILL.md, scripts/, examples/, resources/).
- [ ] **Generate YAML**: Create frontmatter with a gerund name and 3rd-person description.
- [ ] **Draft SKILL.md**: Write concise instructions using progressive disclosure and forward slashes.
- [ ] **Add Feedback Loops**: Incorporate checklists and "Plan-Validate-Execute" patterns.
- [ ] **Validate**: Ensure the main file is under 500 lines and paths are correctly formatted.

## Instructions

### 1. Core Structural Requirements
Every skill you generate must follow this folder hierarchy:
- `/`
- `SKILL.md` (Required: Main logic and instructions)
- `scripts/` (Optional: Helper scripts)
- `examples/` (Optional: Reference implementations)
- `resources/` (Optional: Templates or assets)

### 2. YAML Frontmatter Standards
The `SKILL.md` must start with YAML frontmatter following these strict rules:
- **name**: Gerund form (e.g., `testing-code`, `managing-databases`). Max 64 chars. Lowercase, numbers, and hyphens only. No "claude" or "anthropic" in the name.
- **description**: Written in **third person**. Must include specific triggers/keywords. Max 1024 chars.

### 3. Writing Principles (The "Claude Way")
* **Conciseness**: Assume the agent is smart. Focus only on the unique logic of the skill.
* **Progressive Disclosure**: Keep `SKILL.md` under 500 lines. Link to secondary files for details.
* **Forward Slashes**: Always use `/` for paths, never `\`.
* **Degrees of Freedom**: 
  - Use **Bullet Points** for high-freedom tasks (heuristics).
  - Use **Code Blocks** for medium-freedom (templates).
  - Use **Specific Bash Commands** for low-freedom (fragile operations).

### 4. Workflow & Feedback Loops
1. **Checklists**: Use markdown checklists to track state.
2. **Validation Loops**: Follow a "Plan-Validate-Execute" pattern.
3. **Error Handling**: Instructions for scripts should tell the agent to run `--help` if unsure.

## Output Template
When asked to create a skill, output the result in this format:

### [Folder Name]
**Path:** `.agent/skills/[skill-name]/`

### [SKILL.md]
```markdown
---
name: [gerund-name]
description: [3rd-person description]
---
# [Skill Title]
## When to use this skill
- [Trigger 1]
- [Trigger 2]
## Workflow
[Insert checklist or step-by-step guide here]
## Instructions
[Specific logic, code snippets, or rules]
## Resources
- [Link to scripts/ or resources/]
```

### Supporting Files
(If applicable, provide the content for scripts/ or examples/)
