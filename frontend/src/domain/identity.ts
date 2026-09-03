export type IdentityRole = "wallet" | "authoritySafe" | "relayer" | "guardian";

export interface IdentityPresentation {
  label: string;
  description: string;
}

export const identityPresentation: Record<IdentityRole, IdentityPresentation> = {
  wallet: {
    label: "Connected wallet",
    description: "The account currently connected in your browser.",
  },
  authoritySafe: {
    label: "Authority Safe",
    description: "The Ethereum Safe that approves this policy. It remains the source of authority.",
  },
  relayer: {
    label: "Relayer",
    description: "Any connected wallet may submit an approved action. Relayers cannot change what they submit.",
  },
  guardian: {
    label: "Guardian",
    description: "A limited Creditcoin role that can pause remaining actions during an incident.",
  },
};
