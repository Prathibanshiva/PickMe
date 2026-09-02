# PickMe — Research & Academic Framework
### Deep-Dive Version 2 (Competitive Analysis + Full AI/ML Explanation)
### Addressing Mentor Feedback — Review 0
 
---
 
## Part A — Understanding the Landscape (Why This Matters)
 
Before defining PickMe's algorithm, it's important to see exactly where it sits relative to every major player already operating in India's mobility space. This is what turns "we built an app" into "we identified a real, provable gap." Below is what each existing platform actually does — not marketing language, but their actual matching mechanics.
 
### A.1 The Two Existing Categories
 
**Category 1 — Peer-to-Peer (P2P) Carpooling Apps: Quick Ride, sRide, BlaBlaCar**
 
These apps (Quick Ride is India's largest, with ~50L+ downloads and a presence across every major metro) work on a fundamentally different model than a taxi app:
 
- A regular commuter who **already owns a car/bike and is already making the trip** posts their route as a "Ride Offer."
- A passenger searching for a ride sees a **Route Match %** — a similarity score between their route and the driver's route (Quick Ride explicitly frames this as "Tinder for your commute," where routes above ~90% overlap are called a "perfect match").
- The matching is fundamentally **static and schedule-based** — it works well for daily office commutes with fixed timing (same person, same route, every day), but poorly for spontaneous, on-demand travel.
- There is no owned fleet, no dispatch engine, and no real-time re-optimization — the platform is a discovery/listing layer over people's already-planned trips, plus trust/safety features (ID verification, gender filters, company-based grouping).
- **Critically: there is no occupancy-first dispatch.** The system does not look at a live vehicle that's already mid-trip with spare seats and proactively insert a new nearby passenger into it. It only matches two people who both separately decided to travel that route at that time.
**Category 2 — On-Demand Aggregators: Uber, Ola, Rapido, Namma Yatri, inDrive**
 
These apps solve a different problem: getting *a* vehicle to you fast.
 
- Namma Yatri (Bengaluru-origin, now 100M+ trips) pioneered a **zero-commission, subscription-based** model and focuses purely on fast one-rider-one-driver dispatch by proximity — it explicitly assigns the *closest* driver, with no pooling logic at all.
- Uber's pooling product (UberPool, now largely rebranded/relaunched as "Uber Share" or replaced by fixed-route Uber Shuttle buses in some cities) *did* attempt real-time pooling, but was paused during COVID and has only partially returned in a few Indian cities — and even where live, industry research on these systems (see Part B) shows that most production pooling engines use **short-sighted, greedy dispatch** that doesn't systematically optimize occupancy across the fleet.
- Rapido, Ola: primarily solo-vehicle dispatch (bike/auto/cab); pooling is not their core mechanic.
- None of these platforms are built **occupancy-first** — occupancy is, at best, a side feature bolted onto a system whose core logic is "nearest available vehicle."
### A.2 The Precise, Defensible Gap
 
Putting these together, here is the gap **no current Indian platform fully closes**:
 
> Existing platforms force a choice between (a) **schedule-based P2P carpooling** with high route-match accuracy but no real-time, on-demand dispatch or fleet-level optimization (Quick Ride, sRide), or (b) **on-demand aggregation** with fast dispatch but matching logic that is either purely proximity-based (Namma Yatri, Rapido) or, where pooling exists, uses short-sighted greedy insertion rather than a transparent, multi-factor, constraint-optimized matching engine (Uber/Ola pooling).
 
**PickMe's position:** a single on-demand app that treats **occupancy as the primary optimization objective**, not an add-on — actively checking, for every new ride request, whether an already-active or about-to-depart vehicle can absorb it before ever spinning up a new solo trip, using an explicit, benchmarked, constraint-based scoring algorithm (detailed in Part B) rather than "nearest driver" logic.
 
This is also empirically well-motivated: published transportation research shows **average private-vehicle occupancy is only around 1.2 people per car**, and that effective ride-pooling can raise per-kilometer occupancy by as much as **48%**, while separate studies report **19–33% reductions in total vehicle-miles and taxi/vehicle requirements** when pooling is done well. That is the real-world magnitude of the problem PickMe is targeting — not a marginal UX improvement, but a measurable congestion, cost, and emissions lever.
 
---
 
## Part B — The AI/ML System, Explained From First Principles
 
This section explains **every concept literally**, in the order a matching engine actually uses them, so you (and your mentor) can see exactly what "AI/ML" means in PickMe's context — this is not a black-box neural network; it's a transparent, explainable optimization system, which is *more* defensible for an academic evaluation because every decision can be traced and justified.
 
### B.1 Why This Is Formally a Hard Problem (NP-Hardness)
 
Matching N passengers to M vehicles, where each vehicle can carry multiple passengers and every possible combination has a different cost, is a classic **combinatorial optimization problem**. Academic literature on ride-matching (Agatz et al., Santos & Xavier, and others) formally classifies the general dynamic ride-matching problem as **NP-hard** — meaning there's no known algorithm that finds the perfect answer quickly as the number of passengers/vehicles grows. This is *why* every real-world platform (Uber, Didi, academic systems) uses **heuristics or approximations** instead of brute-force perfect optimization. This single fact is important for your documentation: it justifies *why* PickMe uses a scoring + constrained-assignment approach rather than claiming to find a mathematically perfect answer every time — that's the same trade-off every production ride-pooling system in the world makes.
 
### B.2 Step 1 — Route Similarity (How PickMe Decides Two Trips "Belong Together")
 
Before anything else, the system needs a number representing "how much do these two trips overlap." Two literal techniques, in increasing order of sophistication:
 
- **Haversine Distance:** the standard formula for calculating the great-circle distance between two GPS coordinates (latitude/longitude) on Earth's surface. This is what computes "how far is the passenger's pickup point from a point on the driver's existing route" — the basic building block for every distance calculation in the system.
- **Route Overlap / Corridor Matching:** rather than comparing single points, the system compares the *path* — represented as a sequence of GPS points or road segments — and computes what fraction of the new passenger's path lies within a small buffer (e.g., 300–500m) of the existing route. This is conceptually the same idea Quick Ride's "Route Match %" uses, but computed dynamically for a live, moving vehicle rather than two static schedules.
This produces a **RouteSimilarity score between 0 and 1**, which becomes the first input to the matching engine.
 
### B.3 Step 2 — Candidate Generation (Reducing the Search Space)
 
You never compare a new passenger against *every* vehicle in the city — that would be computationally wasteful. Instead:
 
1. Query only vehicles currently active (on a trip or available) within a feasible radius of the passenger's pickup point.
2. Discard any vehicle whose direction of travel is roughly opposite to the passenger's requested direction (a cheap early filter using bearing/heading comparison).
3. What remains is a small **candidate set** — typically single-digit to low double-digit vehicles — that is realistically reachable. This preprocessing step is explicitly called out in ride-matching research as essential for making real-time performance possible (it turns an otherwise expensive citywide search into a fast local one).
### B.4 Step 3 — Constraint Filtering (Hard Rules That Can't Be Broken)
 
For each candidate, check hard constraints — if any fail, the candidate is discarded immediately, before any scoring happens:
 
- **Capacity constraint:** remaining seats ≥ passengers requested (e.g., an Auto already carrying 2 of its max 3 cannot take a 2-person request).
- **Detour constraint:** inserting the new pickup/drop would not add more than X extra minutes to the existing passenger(s)' trip (protects the people already in the vehicle).
- **Waiting-time constraint:** the new passenger's estimated wait for pickup does not exceed their maximum tolerance.
### B.5 Step 4 — The Match Suitability Score (The "Scoring Function")
 
For every candidate that survives filtering, compute a single number that ranks how good this match is:
 
```
Score = w1·RouteSimilarity + w2·OccupancyGain − w3·DetourTime
        − w4·WaitingTime − w5·ExtraDistance + w6·CostSavingPotential
```
 
- Every factor is **normalized** to a 0–1 range first (so minutes, kilometers, and percentages can be combined meaningfully).
- `w1…w6` are **weights** representing how much each factor matters. You start with equal weights and can literally tune them later based on which outcomes you want to prioritize (e.g., weight OccupancyGain higher if the research goal is maximizing pooling; weight WaitingTime higher if passenger experience matters more).
- This is a **linear scoring/utility function** — the same core idea used in the published PLOS ONE ride-matching paper's "Joint Sharing Savings" metric, and in the "additional distance" utility function used in the Distance-first dynamic ridesharing algorithm from academic literature. You are not inventing an unusual technique — you're applying a well-established one, which is good for defensibility.
### B.6 Step 5 — The Assignment Problem (Turning Scores Into Actual Matches)
 
Having a score for every (passenger, vehicle) pair is not the same as deciding the final assignment — because multiple passengers might all score highest against the *same* vehicle, and you can only pick one combination.
 
- **Bipartite Graph:** picture two columns — one of waiting passengers, one of available/partially-full vehicles. Draw a line (edge) between every passenger and every vehicle they could feasibly join, and label that line with the Score from Step 5. This is literally called a **bipartite graph** in graph theory, and this exact framing is used by Uber-scale academic matching papers (referred to as GMOMatch and similar systems) and by the classic **maximum-weight bipartite matching** formulation (Agatz et al. modeled single-passenger ride-sharing exactly this way and solved it with the optimization solver CPLEX).
- **Hungarian Algorithm:** a well-known, decades-old algorithm that takes exactly this kind of weighted bipartite graph and finds the overall assignment that **maximizes total score across everyone simultaneously** — not greedily one-by-one. This is what elevates PickMe from "pick the best match for this one passenger" to "pick the best matches for *everyone waiting right now*," which is the actual optimization claim your mentor is asking for.
- **Practical fallback — Greedy/Insertion Heuristic:** for very high request volumes where running the full Hungarian algorithm on every update is too slow, production systems (and PickMe, pragmatically) fall back to an **insertion heuristic**: take each new request as it arrives and insert it into whichever existing vehicle route increases total distance the least, subject to all constraints. This is the same "Distance-first" approach used in real dynamic-ridesharing research, and it's the standard "fast but slightly less optimal" alternative to full bipartite matching.
**Recommended approach for PickMe:** implement the **insertion heuristic first** (simpler, real-time friendly, and already demonstrates optimization thinking) — this is your MVP algorithm. Then implement the **Hungarian-algorithm batch matcher** as a periodic "re-optimization" pass every few seconds across all currently-waiting requests, and use it as the **comparison method** to show how much better true optimization performs versus the fast heuristic. This gives you two algorithms to compare in your evaluation — which directly satisfies your mentor's "comparison with baseline" requirement in a more rigorous way than a single naive baseline.
 
### B.7 Step 6 — Optional ML Layer (What Makes It "Learning," Not Just "Optimization")
 
Everything above is optimization/graph theory — genuinely AI in the classical sense, but not "machine learning" in the sense of a trained model. To add a real learned component:
 
- **Problem framed as classification:** predict the probability that a proposed match will be *successfully completed* (not cancelled by either party) — call it `P(success)`.
- **Features (inputs) the model would use:** route overlap %, detour added (minutes), time of day, day of week, historical cancellation rate for this passenger/driver, current traffic conditions, distance to pickup.
- **Model choice:** start with **Logistic Regression** — it's simple, interpretable (you can literally show which factors increase/decrease cancellation risk), and standard for binary outcomes like this. If time and data allow, a small **Decision Tree** or **Gradient Boosted Tree (XGBoost)** can capture non-linear patterns (e.g., "cancellations spike specifically during heavy rain AND rush hour together" — an interaction a linear model would miss).
- **Where it plugs in:** its output becomes an additional term in the Score formula from B.5 — `+ w7·P(success)` — so a technically good route match that's statistically likely to get cancelled is down-ranked in favor of a slightly less perfect but more reliable match.
- **Training data problem (and its solution):** you won't have real historical ride data as a student project. The standard, literature-accepted solution is to **generate synthetic ride-request data** — randomly simulate thousands of pickup/drop pairs, times, and outcomes with realistic noise — and train/evaluate the model on that simulated dataset. This is explicitly how academic ride-matching papers validate new algorithms before real deployment (e.g., the Haikou, China study and the RMSA papers cited below all use simulation against historical/synthetic trip data before any real-world claim).
### B.8 Putting It All Together — The Full Pipeline
 
```
New Ride Request
      │
      ▼
[1] Compute Route Similarity (Haversine + corridor overlap)
      │
      ▼
[2] Candidate Generation (radius + direction filter)
      │
      ▼
[3] Constraint Filtering (capacity, detour limit, wait limit)
      │
      ▼
[4] Score every surviving (passenger, vehicle) pair
      │      Score = w1·RouteSim + w2·OccupancyGain − w3·Detour
      │              − w4·Wait − w5·ExtraDistance + w6·CostSaving
      │              (+ w7·P(success) if ML layer is included)
      ▼
[5] Assignment
      ├── Real-time: Insertion Heuristic (fast, per-request)
      └── Periodic batch: Hungarian Algorithm (optimal, every few seconds)
      ▼
Final Match → Passenger notified, driver route updated
```
 
---
 
## Part C — Why PickMe Is Necessary (Not Just Valid — Necessary)
 
This is the framing your proposal should lead with, because it turns PickMe from "a student app that technically works" into "a system solving a quantified, real, unsolved problem."
 
1. **The occupancy crisis is real and measured, not assumed.** Average private-vehicle occupancy sits around 1.2 people per vehicle in comparable urban studies — meaning the average car on the road is running at roughly 25–30% of its practical seating capacity for most trips. Every one of those empty seats is a car that didn't need to be on the road.
2. **India's existing solutions have split the problem in half, and each half is incomplete.** Carpooling apps solved *trust and route-matching* but abandoned *on-demand, real-time dispatch*. Aggregators solved *on-demand dispatch* but abandoned *occupancy optimization*. No major Indian platform currently owns both halves in one system with a transparent, benchmarked optimization engine driving the match.
3. **The gap has a quantifiable upside.** Published ride-pooling research reports occupancy improvements up to ~48%, vehicle-mile reductions of 20–30%, and taxi-fleet-size reductions of up to 33% when pooling is optimized well — meaning the potential impact of solving this correctly, even at prototype scale, is large enough to be worth studying, not just building.
4. **This is why it's a research problem, not a feature request.** "Add a pooling toggle to an existing app" is a product feature. "Design and benchmark an occupancy-first, constraint-optimized matching algorithm against real dispatch heuristics, in a market where no major platform currently does this well" is a research contribution — which is exactly the reframe your mentor is asking you to make, and it's genuinely true, not just academic packaging.
---
 
## Part D — Research Gap (Formal Statement for Documentation)
 
> Existing ride-hailing platforms in India split into two categories: schedule-based peer-to-peer carpooling systems (e.g., Quick Ride, sRide), which achieve high route-match accuracy but lack real-time, on-demand dispatch and any fleet-wide occupancy optimization; and on-demand aggregators (e.g., Namma Yatri, Rapido, Ola, Uber), which dispatch quickly but match primarily on proximity, with pooling — where it exists at all — handled by short-sighted, greedy insertion rather than an explicit, constraint-based, multi-factor optimization objective. No major platform treats vehicle occupancy as the primary, transparent optimization target of its matching engine. PickMe proposes a single on-demand application in which every ride request is evaluated, using a constraint-filtered, multi-factor scoring function resolved via bipartite optimization (Hungarian algorithm) with a fast insertion-heuristic fallback, for its potential to be pooled into an existing, already-active vehicle before a new solo trip is ever created — with quantitative before/after benchmarking against both a naive nearest-driver baseline and the fast heuristic to demonstrate measurable gains in occupancy, cost, and vehicle-distance metrics.
 
---
 
## Part E — Matching Algorithm (Detailed, for Documentation)
 
See Part B in full — Sections B.2 through B.6 constitute the complete algorithm specification: Route Similarity → Candidate Generation → Constraint Filtering → Scoring Function → Assignment (Insertion Heuristic + periodic Hungarian Algorithm re-optimization).
 
**Ranking factors used in the Score:** Route similarity, occupancy gain, detour time added to existing passengers, new passenger's waiting time, extra distance driven, and cost-saving potential — each normalized and combined via tunable weights.
 
---
 
## Part F — Performance Evaluation Plan
 
Since real user data isn't available at student-project scale, evaluate via **simulation**: generate a synthetic dataset of ride requests (randomized pickup/drop coordinates within a defined service area, request timestamps, passenger counts) and run all three approaches — Baseline, Insertion Heuristic, and Hungarian batch optimizer — over the identical request stream. Log:
 
| Metric | What it captures |
|---|---|
| Matching accuracy | % of requests successfully matched within all constraints |
| Average passenger waiting time | Mean time from request submission to pickup |
| Vehicle occupancy rate | Average passengers carried per vehicle-trip vs. max capacity |
| Total travel distance/time | Sum of km and minutes driven across the fleet to serve all requests |
| Cost reduction | Estimated fare per passenger, pooled vs. solo trips |
| Successful shared rides | Count of trips carrying 2+ unrelated passengers simultaneously |
 
This mirrors exactly how academic ride-pooling papers validate new dispatch strategies before any real-world claim — simulate on a defined network, compare strategies head-to-head, report the deltas.
 
## Part G — Baseline & Comparison
 
- **Baseline:** naive nearest-available-driver assignment, no pooling consideration (mirrors how Namma Yatri/Rapido-style proximity dispatch behaves).
- **Comparison 1:** Baseline vs. PickMe Insertion Heuristic (shows the value of occupancy-aware constraint filtering + scoring alone).
- **Comparison 2:** Insertion Heuristic vs. Hungarian batch optimizer (shows the additional value of true global optimization over fast greedy assignment — this is the "optimization-based approach" your mentor explicitly asked for).
Report all three across the metrics table in Part F, with the deltas expressed as percentage improvements — this table becomes the centerpiece of both your review presentation and a future paper's results section.
 
## Part H — Scope Clarification
 
**Mini-project scope (deliver this semester):**
- Passenger + driver roles, auth, ride request/booking flow (already largely built)
- Matching engine: Route Similarity + Constraint Filtering + Scoring Function + Insertion Heuristic (mandatory) + Hungarian batch optimizer (target, if time allows)
- Simulation-based evaluation against baseline with the six metrics above
- Documented research gap, algorithm specification, and comparative results
**Future product scope (not evaluated this review):**
- Google Play Store deployment, production SMS OTP (MSG91/Twilio)
- Full admin analytics dashboard, payments/transaction history, driver earnings breakdown
- ML success-prediction layer (Section B.7) trained on real usage data once the app has live users
- Fleet-scale performance tuning, production-grade security hardening, multi-city expansion
---
 
## Summary — Mapping to Mentor's Requirements
 
| Mentor's point | Addressed by |
|---|---|
| 1. AI/ML component | Part B (full pipeline: route similarity, scoring function, bipartite optimization, optional ML layer) |
| 2. Research gap | Part A.2 + Part D |
| 3. Matching algorithm definition | Part B.2–B.6 + Part E |
| 4. Performance evaluation | Part F |
| 5. Optimization approach | Part B.6 (Hungarian algorithm / bipartite matching) |
| 6. Research-oriented comparison | Part G (three-way comparison: baseline vs. heuristic vs. optimal) |
| 7. Scope clarity | Part H |
| (Bonus) Why PickMe is necessary | Part C |
 