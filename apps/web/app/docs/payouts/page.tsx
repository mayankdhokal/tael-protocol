import { A, Callout, Code, CodeBlock, DocPage, H2, P, Ul } from "../_components/doc-page";

const TOC = [
  { label: "How you get paid", href: "#how" },
  { label: "Add a USDC trustline", href: "#trustline" },
  { label: "Fund the wallet with XLM", href: "#xlm" },
  { label: "Use it as your payout wallet", href: "#payto" },
];

export default function PayoutsPage() {
  return (
    <DocPage
      eyebrow="Partners"
      title="Get paid"
      lead="Every paid call settles USDC straight to your Stellar wallet. Here is the one-time setup so it can arrive."
      toc={TOC}
    >
      <H2 id="how">How you get paid</H2>
      <P>
        When an agent pays for your capability, Tael settles the USDC to your payout wallet in the
        same request. The builder share and the Tael fee move on-chain atomically: either both land
        or neither does. There are no invoices, no monthly payouts, and no waiting.
      </P>
      <P>
        Your payout wallet is just a Stellar address you control. You set it as <Code>payTo</Code>{" "}
        when you publish, and you can reuse one wallet across every capability you sell.
      </P>

      <H2 id="trustline">Add a USDC trustline</H2>
      <Callout>
        To receive USDC, your payout wallet must hold a <strong>USDC trustline</strong>. This is a
        Stellar rule, not a Tael setting: an account cannot hold an asset without first trusting its
        issuer. Without the trustline, a payout cannot settle and the paid call fails.
      </Callout>
      <P>Add a trustline to the USDC issuer for the network you are getting paid on:</P>
      <CodeBlock
        title="USDC issuers"
        lang="bash"
        code={`# Mainnet  (Circle USDC)
USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN

# Testnet  (Tael test USDC)
USDC:GBCDXWBEN7YMCBI3DPIWQ5QBGG2NE7G5REZLNJI2E57VVNVDQM7PF7RA`}
      />
      <P>
        Most wallets make this one click. In Freighter, open <Code>Manage assets</Code>, choose{" "}
        <Code>Add an asset</Code>, and paste the issuer above. You can also do it from the{" "}
        <A href="https://developers.stellar.org/docs/tools/cli">Stellar CLI</A>:
      </P>
      <CodeBlock
        title="Add a mainnet USDC trustline"
        lang="bash"
        code={`stellar tx new change-trust \\
  --source YOUR_WALLET \\
  --line USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN \\
  --network mainnet`}
      />

      <H2 id="xlm">Fund the wallet with XLM</H2>
      <P>
        A Stellar account needs a small XLM balance to exist and to hold a trustline: about{" "}
        <Code>1 XLM</Code> base reserve plus <Code>0.5 XLM</Code> per trustline. This XLM is a
        reserve, not a fee, it stays in your account.
      </P>
      <Ul>
        <li>
          <strong>Testnet:</strong> fund from the friendbot (free), then add the trustline above.
        </li>
        <li>
          <strong>Mainnet:</strong> there is no friendbot, so send the account a couple of XLM
          yourself before adding the Circle trustline.
        </li>
      </Ul>

      <H2 id="payto">Use it as your payout wallet</H2>
      <P>
        When you publish a capability, set this wallet as <Code>payTo</Code>. Every settled call
        then pays you there instantly. See{" "}
        <A href="/docs/become-a-capability">Become a capability</A> for the full publish flow.
      </P>
      <Callout>
        On mainnet, <Code>payTo</Code> must be the mainnet wallet that holds the Circle USDC
        trustline. A wallet without the trustline will reject payouts, so set this up before you go
        live.
      </Callout>
    </DocPage>
  );
}
