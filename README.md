# Tantsukava (Dance-choreography-planner)

A web app for planning a dance as a sequence of scenes: where each dancer stands, the path they take to the next scene, and the whole choreography played back as one continuous animation.

## Problem

Choreographers, dance coaches and dance teachers plan formations on paper or with tools that show static positions. Static drawings and ArrangeUs show where dancers stand in each scene, but not how they move between scenes. Transitions are where collisions and timing problems appear, so they are the hardest part to plan and explain to dancers.

## Scope

Three features:

1. Create, rename and delete choreographies. Add, rename, set gender for and delete dancers. Add, rename, reorder and delete scenes, and drag dancers to their places on the stage in each scene.
2. For each scene after the first, show every dancer's path from the previous scene, add, drag and remove waypoints, and set the transition duration.
3. Play the whole choreography as an animation: scenes follow one another and dots move along their paths.

Users sign in with Google and see only their own choreographies. The UI is in Estonian and targets desktop and tablet.

Not in scope: sharing a choreography, video export, music sync and multi-user editing.

## Success criterion

A user creates a choreography of several scenes, sets the dancers' movement paths and watches the whole choreography as one continuous animation. This is being confirmed with the contact person, a choreography student and dance coach.

## Setup

To be added in #2 (local development) and #6 (deployment).

## Team

| Member | GitHub | Role |
|---|---|---|
| Tanel Metshein | W1ttyRat | DB & quality |
| Gert Matthias Eljas | GertMatthias | FE & UX |
| Argo Luur | argoluur | BE & security |
