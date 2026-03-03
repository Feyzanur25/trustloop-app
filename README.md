#TrustLoop<img width="1914" height="914" alt="p6" src="https://github.com/user-attachments/assets/2210dbaa-980b-4f1f-b177-bfa8264e0d58" />
<img width="1914" height="1019" alt="p1" src="https://github.com/user-attachments/assets/4968ee43-8b0b-4b81-ae6d-2d1725bf9d33" />
<img width="1919" height="913" alt="Ekran görüntüsü 2026-03-03 231428" src="https://github.com/user-attachments/assets/590715e4-636d-4b1a-8d39-7ebec9424e91" />
<img width="1904" height="973" alt="Ekran görüntüsü 2026-03-03 230924" src="https://github.com/user-attachments/assets/711b0bb4-c3ae-4be8-9839-a62cc952b588" />
<img width="1912" height="964" alt="Ekran görüntüsü 2026-03-03 225205" src="https://github.com/user-attachments/assets/6ea14010-5eed-4a94-a6a0-3de96496ef6d" />
<img width="1919" height="983" alt="Ekran görüntüsü 2026-03-03 224717" src="https://github.com/user-attachments/assets/6f8701c0-1f6b-466d-84fc-90ce37b3c063" />
<img width="1914" height="914" alt="p6" src="https://github.com/user-attachments/assets/ab1c4e49-5095-41fd-a102-08d3b4b19b6a" />


Test the application by connecting a Freighter wallet on Stellar Testnet.
On-chain Trust Signals for Freelancers & Clients (Stellar + Soroban)

TrustLoop is a lightweight trust-tracking dApp that converts real collaboration milestones into verifiable on-chain signals. Users can create a loop with a counterparty, confirm progress, close the loop, and visualize trust events and loop statistics — all on Stellar Testnet with optional Soroban integration.

Built for hackathons (Level 5–6 scope), TrustLoop provides a clear MVP, measurable outcomes, and a real on-chain audit trail.


## Live Demo

Production URL:
https://trustloop-ap-git-main-feyzanur25s-projects.vercel.app


#What Problem Does TrustLoop Solve?

Freelancers and clients often struggle with:

Trust: Did the other party actually confirm the milestone?

Proof: Screenshots and chat messages are not reliable evidence.

Reputation portability: Platform-bound ratings do not transfer across ecosystems.

TrustLoop addresses this by writing compact, trackable trust events directly to the blockchain:

trust.created

trust.confirmed

trust.closed

These events generate transparent statistics and a verifiable collaboration history.

#Core Concept

A TrustLoop represents a structured collaboration relationship between two parties.

Each loop contains:

Loop ID

Counterparty public key

Role (Client or Freelancer)

Expiration duration

Status (Pending, Active, Completed)

Trust score

#Loop Lifecycle
Event	Meaning	Status
trust.created	Loop created on-chain	Active
trust.confirmed	Counterparty confirmed progress	Pending
trust.closed	Loop completed	Completed

The UI reads metadata locally and synchronizes loop state through Horizon operations and blockchain events.

#Features
Current MVP

Wallet connection (Freighter / Stellar Testnet)

Create Loop (writes manage_data event on-chain)

Confirm Loop (writes trust.confirmed)

Close Loop (writes trust.closed)

Dashboard statistics:

Active Loops

Pending

Average Score

Completed

On-chain events feed (Horizon operations rendered as readable timeline)

Loop search and filtering

Local metadata storage (localStorage)

#Extended Architecture

Soroban smart contract integration

Event-based reputation scoring model

Milestone-based trust structure

Scalable architecture for dispute resolution logic

#Technical Implementation

TrustLoop writes trust events using Stellar manage_data operations with compact payloads (under 64 bytes).

Example:

key: trust.created
value: TL-001|created

Events are fetched from:

/accounts/:publicKey/operations

Filtered by operation type and trust event keys to construct a readable timeline.

#Technology Stack

Frontend:

React

Vite

Tailwind CSS

Blockchain:

Stellar Testnet

Horizon API

Wallet:

Freighter

Smart Contracts:

Soroban (optional integration layer)

#Installation
cd web
npm install
npm run dev

Open in browser:

http://localhost:5173

#Wallet Setup

Install the Freighter browser extension

Switch network to Testnet

Create or import a wallet

Fund the account using Stellar Friendbot

#Demo Flow

Connect wallet

Click “New Loop”

Enter a counterparty address

Create a loop (writes trust.created on-chain)

Confirm or close the loop

View blockchain events in the Events page

#Roadmap

Two-party confirmation mechanism

Soroban contract-based trust registry

Weighted reputation algorithm

Public wallet-based trust profiles

Milestone-based collaboration model

Dispute resolution logic
