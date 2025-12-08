"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shield, Lock, Eye, Database, UserCheck } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Wallet Information",
          text: "When you connect your Web3 wallet to use Cosmic Signature, we collect your public wallet address. This is necessary to process transactions, display your NFTs, track your bids, and award prizes.",
        },
        {
          subtitle: "Transaction Data",
          text: "We collect information about your interactions with our smart contracts, including bids placed, NFTs won, staking activities, and prize claims. All of this data is publicly available on the blockchain.",
        },
        {
          subtitle: "Usage Data",
          text: "We may collect anonymous usage data such as pages visited, time spent on the platform, and general interaction patterns to improve our service.",
        },
      ],
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Service Delivery",
          text: "Your wallet address and transaction data are used to provide you with the game services, including processing bids, managing NFTs, distributing prizes, and displaying your game statistics.",
        },
        {
          subtitle: "Platform Improvement",
          text: "We use aggregated, anonymous data to improve the platform, fix bugs, and develop new features.",
        },
        {
          subtitle: "Communication",
          text: "We may use your information to send important updates about the platform, such as security notifications or major changes to the game mechanics.",
        },
      ],
    },
    {
      icon: Shield,
      title: "Data Security",
      content: [
        {
          subtitle: "Blockchain Security",
          text: "All game transactions are secured by the Ethereum blockchain. We do not have custody of your funds or NFTs - they remain in your wallet at all times.",
        },
        {
          subtitle: "Infrastructure Security",
          text: "Our web infrastructure uses industry-standard security measures including HTTPS encryption, secure hosting, and regular security audits.",
        },
        {
          subtitle: "No Passwords",
          text: "We never ask for or store passwords. Authentication is handled entirely through your Web3 wallet.",
        },
      ],
    },
    {
      icon: Eye,
      title: "Data Sharing and Disclosure",
      content: [
        {
          subtitle: "Public Blockchain Data",
          text: "All blockchain transactions are public by nature. Your wallet address, bids, NFT ownership, and prize winnings are visible on the blockchain and through our platform.",
        },
        {
          subtitle: "Third-Party Services",
          text: "We may use third-party services for analytics, hosting, and infrastructure. These services are bound by their own privacy policies and we ensure they meet appropriate data protection standards.",
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information if required by law, court order, or government regulation.",
        },
      ],
    },
    {
      icon: UserCheck,
      title: "Your Rights and Choices",
      content: [
        {
          subtitle: "Wallet Control",
          text: "You maintain full control over your wallet and can disconnect it from our platform at any time.",
        },
        {
          subtitle: "Blockchain Permanence",
          text: "Please note that blockchain transactions are permanent and cannot be deleted. Once a bid is placed or an NFT is transferred, this information remains on the blockchain forever.",
        },
        {
          subtitle: "Cookie Preferences",
          text: "Our website may use cookies for basic functionality. You can control cookie settings through your browser.",
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
            <h1 className="heading-xl text-balance mb-6">Privacy Policy</h1>
            <p className="body-xl text-text-secondary">
              Your privacy is important to us. This policy explains how Cosmic
              Signature collects, uses, and protects your information when you
              interact with our decentralized application.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Content */}
      <section className="section-padding">
        <Container size="lg">
          <div className="space-y-8">
            {/* Introduction */}
            <Card glass>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Shield className="text-primary" size={24} />
                  <span>Introduction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-text-secondary">
                <p>
                  Cosmic Signature is a decentralized blockchain game built on
                  Ethereum. As a decentralized application (dApp), we operate
                  differently from traditional web applications when it comes to
                  data and privacy.
                </p>
                <p>
                  This Privacy Policy describes how we handle information in
                  connection with your use of Cosmic Signature. By using our
                  platform, you agree to the collection and use of information
                  in accordance with this policy.
                </p>
              </CardContent>
            </Card>

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
                        <h3 className="font-semibold text-text-primary">
                          {item.subtitle}
                        </h3>
                        <p className="text-text-secondary leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Additional Information */}
            <Card glass>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-text-secondary">
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Children&apos;s Privacy
                  </h3>
                  <p className="leading-relaxed">
                    Our service is not intended for users under the age of 18.
                    We do not knowingly collect personal information from
                    children. If you are a parent or guardian and believe your
                    child has provided us with personal information, please
                    contact us.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Changes to This Policy
                  </h3>
                  <p className="leading-relaxed">
                    We may update our Privacy Policy from time to time. We will
                    notify you of any changes by posting the new Privacy Policy
                    on this page and updating the &quot;Last Updated&quot; date.
                    You are advised to review this Privacy Policy periodically
                    for any changes.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Contact Information
                  </h3>
                  <p className="leading-relaxed">
                    If you have any questions about this Privacy Policy, please
                    contact us through our official community channels or GitHub
                    repository.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    International Users
                  </h3>
                  <p className="leading-relaxed">
                    Cosmic Signature operates on the Ethereum blockchain, which
                    is globally accessible. By using our platform, you
                    acknowledge that your information may be processed and
                    stored in various locations around the world.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card glass className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Shield size={24} className="text-primary flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-text-primary">
                      Important: Blockchain Transparency
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      Please be aware that blockchain transactions are public
                      and permanent. Your wallet address and all your
                      interactions with our smart contracts are publicly visible
                      and cannot be deleted. This is a fundamental characteristic
                      of blockchain technology, not a limitation of our privacy
                      practices.
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

