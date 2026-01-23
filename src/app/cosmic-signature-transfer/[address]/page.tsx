"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { ElegantTable } from "@/components/data/ElegantTable";
import { api } from "@/services/api";
import { formatDate } from "@/lib/utils";

interface Transfer extends Record<string, unknown> {
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  TokenId: number;
  FromAddr: string;
  ToAddr: string;
  FromAid: number;
  ToAid: number;
  TransferType: number;
}

export default function CosmicSignatureTransferPage() {
  const params = useParams();
  const address = params.address as string;
  
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransfers() {
      if (!address) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCSTTransfers(address);
        setTransfers(data);
      } catch (err) {
        console.error("Failed to fetch transfers:", err);
        setError("Failed to load transfer history");
      } finally {
        setLoading(false);
      }
    }

    fetchTransfers();
  }, [address]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "User", href: `/user/${address}` },
              { label: "NFT Transfers" },
            ]}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/user/${address}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Profile
                </Button>
              </Link>
            </div>

            <h1 className="heading-lg mb-4">
              Cosmic Signature NFT Transfers
            </h1>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-text-secondary">For address:</span>
              <AddressDisplay address={address} showCopy={true} />
            </div>

            <p className="body-lg text-text-secondary">
              Complete transfer history for all Cosmic Signature NFTs
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Transfers Table */}
      <section className="section-padding">
        <Container>
          {loading ? (
            <Card glass className="p-12 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-text-secondary">Loading transfer history...</p>
              </div>
            </Card>
          ) : error ? (
            <Card glass className="p-12 text-center">
              <p className="text-status-error mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Card>
          ) : transfers.length === 0 ? (
            <Card glass className="p-12 text-center">
              <Calendar className="mx-auto mb-4 text-text-muted" size={64} />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No Transfers Found
              </h3>
              <p className="text-text-secondary mb-6">
                This address has no Cosmic Signature NFT transfer history yet.
              </p>
              <Link href={`/user/${address}`}>
                <Button variant="outline">
                  Back to Profile
                </Button>
              </Link>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card glass className="p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-text-primary mb-2">
                      Transfer History
                    </h2>
                    <p className="text-text-secondary">
                      {transfers.length} transfer{transfers.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                </div>
              </Card>

              <ElegantTable
                data={transfers}
                mode="table"
                columns={[
                  {
                    key: "RecordId",
                    label: "Date",
                    sortable: true,
                    render: (_value, item) => {
                      const transfer = item as Transfer;
                      return (
                        <div className="flex flex-col">
                          <span className="text-text-primary text-sm">
                            {formatDate(new Date(transfer.Tx.TimeStamp * 1000))}
                          </span>
                          <span className="text-text-muted text-xs">
                            Block #{transfer.Tx.BlockNum}
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    key: "TokenId",
                    label: "NFT",
                    sortable: true,
                    render: (value) => {
                      const tokenId = value as number;
                      return (
                        <Link
                          href={`/gallery/${tokenId}`}
                          className="text-primary hover:underline font-mono"
                        >
                          #{tokenId}
                        </Link>
                      );
                    },
                  },
                  {
                    key: "FromAddr",
                    label: "From",
                    render: (value) => {
                      return (
                        <AddressDisplay
                          address={value as string}
                          showCopy={false}
                          showLink={true}
                        />
                      );
                    },
                  },
                  {
                    key: "ToAddr",
                    label: "To",
                    render: (value) => {
                      return (
                        <AddressDisplay
                          address={value as string}
                          showCopy={false}
                          showLink={true}
                        />
                      );
                    },
                  },
                  {
                    key: "TransferType",
                    label: "Transaction",
                    render: (_value, item) => {
                      const transfer = item as Transfer;
                      const txHash = transfer.Tx.TxHash;
                      return (
                        <a
                          href={`https://arbiscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                        >
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          <ExternalLink size={14} />
                        </a>
                      );
                    },
                  },
                ]}
                emptyMessage="No transfers found"
              />
            </motion.div>
          )}
        </Container>
      </section>
    </div>
  );
}
