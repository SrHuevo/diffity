---
name: diffity-learn
description: >-
  Learn a programming concept by exploring real examples in the current
  codebase. Builds a teaching tour that progressively explains the concept from
  simple to complex.
user-invocable: true
---

# Diffity Learn Skill

You are creating a **teaching tour** — a narrated, step-by-step walkthrough that teaches a programming concept using real examples found in the current codebase. Unlike a regular code tour that explains "how does feature X work", this tour teaches a **concept** (e.g. closures, generics, error handling patterns) by finding real instances in the code and explaining them progressively.

## Arguments

- `concept` (required): The programming concept to teach. Examples:
  - `/diffity-learn closures in JavaScript`
  - `/diffity-learn async/await`
  - `/diffity-learn dependency injection`
  - `/diffity-learn React hooks`
  - `/diffity-learn error handling patterns`
  - `/diffity-learn generics in TypeScript`

## CLI Reference

```
diffity agent tour-start --topic "<text>" [--body "<text>"] --json
diffity agent tour-step --tour <id> --file <path> --line <n> [--end-line <n>] --body "<text>" [--annotation "<text>"] --json
diffity agent tour-done --tour <id> --json
diffity list --json
```

## Prerequisites

1. Check that `diffity` is available: run `which diffity`. If not found, install it with `npm install -g diffity`.
2. Ensure a tree instance is running: run `diffity list --json`.
   - If no instance is running, start one: run `diffity tree --no-open` using the Bash tool with `run_in_background: true`, wait 2 seconds, then run `diffity list --json` to get the port.

## Instructions

### Phase 1: Assess the learner and detect prerequisites

Before searching for code, figure out what the learner needs.

1. **Determine the learner's level.** Look at how they phrased their request:
   - Vague or broad phrasing (e.g. "learn closures") → assume **beginner** — no prior knowledge of this concept
   - Specific phrasing (e.g. "learn how closures work with React hooks") → assume **intermediate** — understands basics, wants deeper patterns
   - If genuinely ambiguous, default to **beginner** — it's better to over-explain than to lose someone

2. **Identify prerequisites.** Many concepts build on others. Before teaching the requested concept, ask yourself: "What must the reader already understand for my first example to make sense?"

   Common prerequisite chains:
   - Generics → requires understanding of types and interfaces
   - Async/await → requires understanding of callbacks and Promises
   - Higher-order components → requires understanding of components and props
   - Dependency injection → requires understanding of classes/interfaces
   - Closures → requires understanding of functions and scope

   If the concept has prerequisites, you will briefly cover them in the tour intro (Phase 3, step 1) so the reader isn't lost from the start.

### Phase 2: Find examples in the codebase

This is the most important phase. You must find **real, concrete examples** of the concept in this codebase.

1. **Identify what to search for.** Based on the concept, determine what code patterns to look for:
   - For "closures": functions returned from other functions, callbacks capturing outer variables, factory patterns
   - For "async/await": async functions, Promise chains, error handling with try/catch in async contexts
   - For "generics": generic type parameters, generic functions/classes, constrained generics
   - For "React hooks": useState, useEffect, useCallback, useMemo, custom hooks
   - Think broadly about what forms the concept takes in practice

2. **Search the codebase.** Use grep, glob, and file reads to find instances. Search for:
   - Language keywords associated with the concept
   - Common patterns and idioms
   - Both simple and complex usage

3. **Select and rank examples.** Pick 3-8 examples that:
   - Are **real and meaningful** — not trivial boilerplate
   - Cover **different facets** of the concept — not 5 examples of the same thing
   - Progress from **simple to complex** — the first example should be the easiest to understand
   - Are **self-contained enough** to explain without extensive context

4. **Understand each example deeply.** Read the surrounding code. Know why the concept is used here, what alternatives existed, and what would break without it.

5. **Handle sparse codebases.** If you find **fewer than 3 real examples**:
   - Use whatever real examples exist — even 1 real example is valuable
   - For the remaining steps, **create small teaching snippets**. Write a minimal, focused code file (e.g. `_learn_closures_example.ts`) that demonstrates the facet you need. Place it in a temporary location and include it as a tour step. In the step body, clearly label it: "This is a standalone example to illustrate X — it's not part of the codebase."
   - Delete these temporary files after the tour is created (they live in the tour, not the repo)
   - **Do NOT skip facets** of the concept just because the codebase doesn't happen to use them. A beginner needs a complete picture.

### Phase 3: Create the teaching tour

The tour should feel like a patient teacher walking a beginner through real code, building their understanding step by step.

1. **Start the tour** with a concept introduction:
   ```
   diffity agent tour-start --topic "<Concept Name>" --body "<concept overview>" --json
   ```

   The `--topic` should be the concept name — keep it to **2-5 words** (e.g. "JavaScript Closures", "Async/Await Patterns", "TypeScript Generics").

   **Writing the intro body (step 0):**
   This is a standalone explanation of the concept that the reader sees before any code. Write it for someone who has **never encountered this concept before**. Include:

   - **Prerequisites recap** — if the concept builds on others, give a 2-3 sentence refresher. For example, before teaching closures: "Quick refresher: in JavaScript, functions can be defined inside other functions, and each function creates its own **scope** — a private space where its variables live. If you're comfortable with that, you're ready." This should be enough that a beginner isn't lost, but brief enough that it doesn't derail the tour.
   - **What** the concept is — a clear, jargon-free definition. Avoid circular definitions ("a closure is when you close over..."). Use plain words.
   - **Why** it exists — what problem does it solve? What would code look like without it? Give a concrete "before/after" if possible.
   - **Mental model** — an analogy or way of thinking about it that makes it click. Good analogies connect to everyday experience, not to other programming concepts.
   - **What to look for** — the syntactic or structural clues that tell you "this is an example of X"
   - **Glossary** — if the concept involves jargon terms that will appear throughout the tour, define them here in a short list. For example:
     > **Terms you'll see in this tour:**
     > - **Scope** — the area of code where a variable is accessible
     > - **Lexical environment** — a fancy name for "the variables that existed where a function was defined"
   - A preview of what the reader will see: "In this codebase, we'll look at N examples ranging from simple to complex"

   Use rich markdown formatting. Do NOT list the files you'll visit — this is a concept explanation, not a table of contents.

   Extract the tour ID from the JSON output.

2. **Add steps** in order of increasing complexity. For each step:
   ```
   diffity agent tour-step --tour <id> --file <path> --line <start> --end-line <end> --body "<narrative>" --annotation "<short label>" --json
   ```

   **Writing teaching steps:**

   Each step should teach **one facet** of the concept through a concrete example. The narrative has two jobs: explain the concept AND explain why it's used in this specific code.

   Structure each step's body as:

   - **What you're looking at** — orient the reader in the code. What does this file/function do? (1-2 sentences)
   - **The concept in action** — point out where and how the concept appears. Be specific: "On line 15, `config` is captured by the inner function — this is a closure because..."
   - **Why it's used here** — what problem does this solve in this specific context? What would the code look like without this pattern?
   - **Key takeaway** — one sentence summarizing what this example teaches about the concept

   **Beginner-friendly language guidelines:**
   - Define jargon **inline** the first time it appears in any step. Don't assume the reader remembers the glossary. Example: "This function is **generic** (meaning it works with any type, not just one specific type) — notice the `<T>` after the function name."
   - Use **"notice how..."** and **"the key thing here is..."** to direct attention. Beginners often don't know where to look in a block of code.
   - Prefer **"this means..."** over **"i.e."** or **"in other words"**. Spell things out.
   - When comparing to a previous step, be explicit: "In Step 2, we saw X used for Y. Here, the same idea is used for Z — but notice the difference: ..."

   **Progression guidelines:**
   - **First example**: The simplest, most isolated instance. Minimal surrounding complexity. The reader should think "oh, that's all it is?"
   - **Middle examples**: Introduce variations, edge cases, or more sophisticated usage. Each example should add one new dimension.
   - **Last example**: The most complex or elegant usage. By now the reader has enough context to appreciate it.

   **Interactive checkpoints:**
   After every 2-3 steps, add a short "check your understanding" prompt inside the step body. These are not separate steps — they go at the end of a teaching step. Format them as:

   > **Checkpoint:** Look at line 42. Before reading on — can you predict what `result` will be? What would change if we removed the `await` keyword?

   or

   > **Try it:** Find another example of this pattern in the codebase. Hint: search for `useCallback` — how is it similar to what we just saw?

   These prompts turn passive reading into active learning. Keep them short (1-3 sentences). They should reinforce the current step's key takeaway, not introduce new concepts.

   **IMPORTANT — Goto links for code references:**
   Every time you mention a function, class, variable, or type that exists in a known file, you MUST make it a goto link. Do NOT use plain backtick code for symbols you can locate. The reader should be able to click any code reference to jump to its definition.

   Syntax: `` [`symbolName`](goto:path/to/file.ts:startLine-endLine) `` or `` [`symbolName`](goto:path/to/file.ts:line) `` for a single line.
   Example: `` [`handleDragEnd`](goto:src/KanbanContent.jsx:42-58) ``

   These render as clickable inline code that navigates to the file and highlights the target lines. Use plain backtick code ONLY for generic terms, CLI commands, language keywords, or symbols you haven't located in the codebase.

   **Do:**
   - Use **bold** for concept terms being introduced or reinforced
   - Use [sub-highlights](focus:startLine-endLine) when a step covers 30+ lines to guide the reader's eye
   - Draw connections between examples: "Unlike the previous example where X, here we see Y"
   - Include "what if" scenarios: "If we removed the `async` keyword here, this would return a raw Promise instead of..."
   - Use mermaid diagrams sparingly — only when visualizing flow or state helps (e.g., a Promise chain, a closure's scope chain)

   **Don't:**
   - Assume knowledge of the concept — you're teaching it
   - Just describe the syntax — explain the *why*
   - Use jargon without defining it first
   - Skip explaining why this specific code uses the pattern
   - Show the same facet of the concept repeatedly

3. **Add a summary step** as the final step of the tour. Pick any file from the last example (reuse the same file/line range) and write a body that:

   - **Recaps the key rules** — list the 3-5 most important things the reader learned, phrased as memorable rules. Example:
     > **What you've learned:**
     > 1. A closure is a function that remembers the variables from where it was created
     > 2. Closures are created every time a function is defined inside another function
     > 3. They're useful for data privacy, factory functions, and callbacks
     > 4. Watch out for closures in loops — they share the same variable unless you create a new scope
   - **Common mistakes** — list 2-3 beginner pitfalls related to this concept. These are the mistakes they'll make in the first week.
   - **Where to go next** — suggest 1-2 related concepts to learn next, connecting them to what was just learned. Example: "Now that you understand closures, a great next step is **currying** — it's a pattern that uses closures to transform how functions accept arguments."

   Use the annotation `"Summary"` for this step.

4. **Finish the tour:**
   ```
   diffity agent tour-done --tour <id> --json
   ```

### Phase 4: Clean up and open in browser

1. If you created any temporary teaching snippet files in Phase 2 step 5, delete them now.
2. Get the running instance port from `diffity list --json`.
3. Open the tour: `open "http://localhost:<port>/tour/<tour-id>"` (or the appropriate command for the user's OS).
4. Tell the user the tour is ready:

   > Your learning tour is ready — check your browser.

## Quality Checklist

Before finishing, verify:

- [ ] Intro (step 0) explains the concept clearly for someone who has never seen it
- [ ] Prerequisites are briefly covered if the concept builds on other concepts
- [ ] Jargon terms are defined in the glossary AND inline when first used in steps
- [ ] Examples progress from simple to complex
- [ ] Each step explains both the concept AND why it's used in this specific code
- [ ] No two steps teach the same facet — each adds something new
- [ ] At least 3 examples are included (using teaching snippets if the codebase lacks enough)
- [ ] Interactive checkpoints appear every 2-3 steps
- [ ] A summary step recaps key rules, common mistakes, and next steps
- [ ] Every function, class, or symbol reference with a known file location uses a goto link — no plain backtick code for locatable symbols
