# ColorTaiko!

**ColorTaiko!** is an Illinois Mathematics Lab (IML) project for Fall 2024 and Spring 2025 in the Department of Mathematics at the University of Illinois Urbana-Champaign (UIUC). It introduces a playful, interactive game that challenges players to explore color patterns and solve puzzles. Future levels will be added, so come back and try your skills as the game evolves!

## What is ColorTaiko!?

The game is inspired by the research article **"The topology and geometry of units and zero-divisors: origami"** by Igor Mineyev. This work explores how certain colorings of bipartite graphs could potentially lead to counterexamples to the **Kaplansky conjectures**, long-standing open problems in algebra related to group algebras. In the full version of the game, solving increasingly difficult levels could potentially bring new insights or counterexamples related to these mathematical problems. 

Particularly, **ColorTaiko!** could potentially shed light on **Kaplansky's conjectures**, which ask: given a field and a torsion-free group, does the group ring contain any non-trivial zero divisors or non-trivial units? The first counterexample to the unit conjecture was presented by Giles Gardam in 2021. This counterexample involved the fundamental group of the Hantzsche–Wendt manifold over a field of characteristic 2, which inspired the paper by Igor Mineyev and, subsequently, this game. The zero-divisor conjecture remains open to this day.

## Current Version

The goal for **ColorTaiko!** is to create a complete bipartite graph that satisfies certain conditions:
- _Level 1_ implements color merging when the condition is satisfied.
- _Level 2_ implements orientation of horizontal edges and detects when orientation fails.
- _Level 3_ (in progress) implements no-fold condition.
- _Level 4P_ (in progress) implements no pattern condition.
- _Level 4.6_ (in progress) implements girth-6 condition on both the top and bottom graphs.
- _Level 5P.6_ (in progress) combines no pattern and girth-6 condition. Successful completion of this level will yield a counterexample to one of the conjectures.

You can play the game at the link below:  
[https://play.math.illinois.edu/ColorTaiko!/](https://play.math.illinois.edu/ColorTaiko!/)
