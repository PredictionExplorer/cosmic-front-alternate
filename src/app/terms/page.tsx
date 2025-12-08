"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  AlertTriangle,
  Scale,
  Shield,
  Users,
  Coins,
} from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      icon: FileText,
      title: "Acceptance of Terms",
      content: [
        {
          text: "By accessing and using Cosmic Signature, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.",
        },
        {
          text: "These terms constitute a legally binding agreement between you and Cosmic Signature. We reserve the right to modify these terms at any time, and such modifications will be effective immediately upon posting.",
        },
      ],
    },
    {
      icon: Users,
      title: "Eligibility and Account Requirements",
      content: [
        {
          subtitle: "Age Requirement",
          text: "You must be at least 18 years old to use Cosmic Signature. By using this platform, you represent and warrant that you meet this age requirement.",
        },
        {
          subtitle: "Wallet Responsibility",
          text: "You are solely responsible for maintaining the security of your Web3 wallet and private keys. Cosmic Signature will never ask for your private keys or seed phrase. Loss of access to your wallet may result in permanent loss of NFTs and funds.",
        },
        {
          subtitle: "Legal Compliance",
          text: "You agree to comply with all applicable laws and regulations in your jurisdiction when using Cosmic Signature, including those related to cryptocurrency, online gaming, and blockchain technology.",
        },
      ],
    },
    {
      icon: Coins,
      title: "Game Mechanics and Smart Contracts",
      content: [
        {
          subtitle: "How the Game Works",
          text: "Cosmic Signature is a decentralized auction game where users place bids using ETH or CST tokens. The last bidder when the timer expires wins the main prize. Additional prizes are distributed according to the published prize structure.",
        },
        {
          subtitle: "Smart Contract Interaction",
          text: "All game actions are executed through smart contracts on the Ethereum blockchain. Once a transaction is confirmed on the blockchain, it cannot be reversed. You acknowledge that blockchain transactions are final and irreversible.",
        },
        {
          subtitle: "Gas Fees",
          text: "You are responsible for paying all Ethereum network gas fees associated with your transactions. Gas fees are separate from bid amounts and are paid to Ethereum miners, not to Cosmic Signature.",
        },
        {
          subtitle: "Random Walk NFT Discount",
          text: "Random Walk NFTs can be used once per NFT to receive a 50% discount on ETH bids. This action is permanent and cannot be undone. Once used, a Random Walk NFT cannot be used again for discounts.",
        },
      ],
    },
    {
      icon: Scale,
      title: "Prizes and Payouts",
      content: [
        {
          subtitle: "Prize Distribution",
          text: "Prizes are distributed automatically according to the smart contract rules. The current prize structure includes Main Prize (25% ETH + NFT), Endurance Champion (CST + NFT), Last CST Bidder (CST + NFT), Chrono-Warrior (8% ETH), Raffle prizes (4% ETH + 9 NFTs), NFT Stakers (6% ETH), and Charity (7% ETH).",
        },
        {
          subtitle: "Claiming Prizes",
          text: "Some prizes require manual claiming through the platform. The Main Prize winner has 24 hours to claim their prize after the round ends. If not claimed within this period, the prize may become available for others to claim according to smart contract rules.",
        },
        {
          subtitle: "No Guaranteed Returns",
          text: "Participation in Cosmic Signature does not guarantee any returns or profits. All bids are considered final, and you may lose the full amount of your bid. Never bid more than you can afford to lose.",
        },
      ],
    },
    {
      icon: Shield,
      title: "Risks and Disclaimers",
      content: [
        {
          subtitle: "Blockchain Technology Risks",
          text: "You acknowledge the risks inherent in blockchain technology, including but not limited to: smart contract vulnerabilities, network congestion, gas price volatility, regulatory changes, and potential loss of funds due to technical issues.",
        },
        {
          subtitle: "No Warranties",
          text: "Cosmic Signature is provided 'as is' without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free from harmful components.",
        },
        {
          subtitle: "Market Volatility",
          text: "Cryptocurrency and NFT markets are highly volatile. The value of ETH, CST tokens, and NFTs may fluctuate significantly. Past performance is not indicative of future results.",
        },
        {
          subtitle: "Smart Contract Audits",
          text: "While we strive to ensure the security of our smart contracts, no audit can guarantee complete security. You use the platform at your own risk.",
        },
      ],
    },
    {
      icon: AlertTriangle,
      title: "Prohibited Activities",
      content: [
        {
          text: "You agree not to engage in any of the following prohibited activities:",
        },
        {
          text: "• Attempting to manipulate or exploit the game mechanics through bugs, glitches, or vulnerabilities",
        },
        {
          text: "• Using bots, scripts, or automated tools to interact with the platform",
        },
        {
          text: "• Engaging in any form of market manipulation or collusion with other users",
        },
        {
          text: "• Attempting to hack, reverse engineer, or compromise the platform's security",
        },
        {
          text: "• Violating any applicable laws or regulations",
        },
        {
          text: "• Creating multiple accounts to gain unfair advantages",
        },
        {
          text: "• Uploading malicious content or attempting denial-of-service attacks",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="info" className="mb-4">
              Last Updated: December 8, 2025
            </Badge>
            <h1 className="heading-xl text-balance mb-6">Terms of Service</h1>
            <p className="body-xl text-text-secondary">
              Please read these terms carefully before using Cosmic Signature.
              By using our platform, you agree to be bound by these terms.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Content */}
      <section className="section-padding">
        <Container size="lg">
          <div className="space-y-8">
            {/* Main Sections */}
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card glass>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <section.icon className="text-primary" size={24} />
                      <span>{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-2">
                        {item.subtitle && (
                          <h3 className="font-semibold text-text-primary">
                            {item.subtitle}
                          </h3>
                        )}
                        <p className="text-text-secondary leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Additional Terms */}
            <Card glass>
              <CardHeader>
                <CardTitle>Additional Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-text-secondary">
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Intellectual Property
                  </h3>
                  <p className="leading-relaxed">
                    All content on Cosmic Signature, including but not limited
                    to text, graphics, logos, and software, is the property of
                    Cosmic Signature or its licensors and is protected by
                    copyright and other intellectual property laws. NFTs awarded
                    through the game grant you ownership of the specific token,
                    but not the underlying intellectual property unless
                    explicitly stated.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Limitation of Liability
                  </h3>
                  <p className="leading-relaxed">
                    To the maximum extent permitted by law, Cosmic Signature and
                    its affiliates shall not be liable for any indirect,
                    incidental, special, consequential, or punitive damages, or
                    any loss of profits or revenues, whether incurred directly or
                    indirectly, or any loss of data, use, goodwill, or other
                    intangible losses resulting from your use of the platform.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Indemnification
                  </h3>
                  <p className="leading-relaxed">
                    You agree to indemnify and hold harmless Cosmic Signature and
                    its affiliates from any claims, losses, damages, liabilities,
                    and expenses (including legal fees) arising from your use of
                    the platform, your violation of these terms, or your
                    violation of any rights of another party.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Dispute Resolution
                  </h3>
                  <p className="leading-relaxed">
                    Any disputes arising from these terms or your use of Cosmic
                    Signature shall be resolved through binding arbitration in
                    accordance with the rules of the American Arbitration
                    Association. You waive any right to a jury trial or to
                    participate in a class action lawsuit.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Governing Law
                  </h3>
                  <p className="leading-relaxed">
                    These terms shall be governed by and construed in accordance
                    with the laws of the jurisdiction where Cosmic Signature
                    operates, without regard to its conflict of law provisions.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Severability
                  </h3>
                  <p className="leading-relaxed">
                    If any provision of these terms is found to be invalid or
                    unenforceable, the remaining provisions shall continue in
                    full force and effect.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Entire Agreement
                  </h3>
                  <p className="leading-relaxed">
                    These terms constitute the entire agreement between you and
                    Cosmic Signature regarding your use of the platform and
                    supersede any prior agreements.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Contact Information
                  </h3>
                  <p className="leading-relaxed">
                    If you have questions about these Terms of Service, please
                    contact us through our official community channels or GitHub
                    repository.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Critical Warning */}
            <Card glass className="bg-status-warning/5 border-status-warning/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle
                    size={24}
                    className="text-status-warning flex-shrink-0 mt-1"
                  />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-text-primary">
                      Important Warning
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      Participating in Cosmic Signature involves financial risk.
                      Cryptocurrency and NFT markets are highly volatile, and you
                      may lose some or all of your investment. Never spend more
                      than you can afford to lose. This platform is not an
                      investment vehicle, and no returns are guaranteed. Always
                      do your own research and consider your financial situation
                      carefully before participating.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acknowledgment */}
            <Card glass className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Shield
                    size={24}
                    className="text-primary flex-shrink-0 mt-1"
                  />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-text-primary">
                      Acknowledgment
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      By using Cosmic Signature, you acknowledge that you have
                      read, understood, and agree to be bound by these Terms of
                      Service. You also acknowledge that you understand the risks
                      associated with blockchain technology, cryptocurrency, and
                      NFTs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}

