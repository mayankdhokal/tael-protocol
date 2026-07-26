/** A capability run the copilot proposes. It never runs on its own — the user
 *  confirms first, then the card pays. Resolved server-side (card + price). */
export interface ProposedAction {
  slug: string;
  operation?: string;
  method?: string;
  /** Query string or JSON body the op will receive. */
  params?: string;
  /** The card that would pay, chosen server-side (an affordable one). */
  cardId: string;
  cardName: string;
  capabilityName: string;
  operationName: string;
  /** USDC price shown on the confirm button. */
  price: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** When the message was created (ms epoch), for the "· time" meta line. */
  createdAt?: number;
  /** A capability run the copilot is proposing; renders as a confirm card. */
  action?: ProposedAction;
  /** True once the proposed action has been run, so the confirm card collapses. */
  actionDone?: boolean;
}

/** Props for the reusable widget, all optional so `<TaelAgent />` just works. */
export interface TaelAgentProps {
  /** POST endpoint that streams the reply as plain text. */
  endpoint?: string;
  /** Name shown in the header. */
  name?: string;
  /** Subtitle under the name. */
  tagline?: string;
  /** First assistant message shown when the panel opens. */
  intro?: string;
  /** One-tap starter prompts. */
  suggestions?: string[];
}
