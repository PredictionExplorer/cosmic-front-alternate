'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins, Award, Send, ArrowLeftRight, FileEdit } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/features/Breadcrumbs';
import { Timeline, TimelineItem } from '@/components/data/Timeline';
import { MOCK_USER_ACTIVITIES } from '@/lib/mockData/activities';

const typeIcons = {
	bid: Coins,
	claim: Trophy,
	stake: Award,
	unstake: Award,
	donation: Send,
	transfer: ArrowLeftRight,
	'name-change': FileEdit
};

export default function MyActivityPage() {
	const [filterType, setFilterType] = useState<'all' | TimelineItem['type']>('all');

	const filteredActivities =
		filterType === 'all' ? MOCK_USER_ACTIVITIES : MOCK_USER_ACTIVITIES.filter(a => a.type === filterType);

	const activityCounts = {
		all: MOCK_USER_ACTIVITIES.length,
		bid: MOCK_USER_ACTIVITIES.filter(a => a.type === 'bid').length,
		claim: MOCK_USER_ACTIVITIES.filter(a => a.type === 'claim').length,
		stake:
			MOCK_USER_ACTIVITIES.filter(a => a.type === 'stake').length +
			MOCK_USER_ACTIVITIES.filter(a => a.type === 'unstake').length,
		other: MOCK_USER_ACTIVITIES.filter(a => ['donation', 'transfer', 'name-change'].includes(a.type)).length
	};

	return (
		<div className="min-h-screen">
			{/* Hero */}
			<section className="section-padding bg-background-surface/50">
				<Container>
					<Breadcrumbs
						items={[{ label: 'My Account', href: '/account' }, { label: 'Activity' }]}
						className="mb-8"
					/>

					<motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
						<h1 className="heading-xl mb-4">Activity Timeline</h1>
						<p className="body-lg">Complete history of your actions in Cosmic Signature</p>
					</motion.div>
				</Container>
			</section>

			{/* Filter Tabs */}
			<section className="sticky top-[72px] lg:top-[88px] z-40 py-6 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
				<Container>
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => setFilterType('all')}
							className={`px-6 py-2 rounded-lg font-medium transition-all ${
								filterType === 'all'
									? 'bg-primary/10 text-primary border border-primary/20'
									: 'bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10'
							}`}
						>
							All ({activityCounts.all})
						</button>
						<button
							onClick={() => setFilterType('bid')}
							className={`px-6 py-2 rounded-lg font-medium transition-all ${
								filterType === 'bid'
									? 'bg-primary/10 text-primary border border-primary/20'
									: 'bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10'
							}`}
						>
							Bids ({activityCounts.bid})
						</button>
						<button
							onClick={() => setFilterType('claim')}
							className={`px-6 py-2 rounded-lg font-medium transition-all ${
								filterType === 'claim'
									? 'bg-primary/10 text-primary border border-primary/20'
									: 'bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10'
							}`}
						>
							Claims ({activityCounts.claim})
						</button>
						<button
							onClick={() => setFilterType('stake')}
							className={`px-6 py-2 rounded-lg font-medium transition-all ${
								filterType === 'stake'
									? 'bg-primary/10 text-primary border border-primary/20'
									: 'bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10'
							}`}
						>
							Staking ({activityCounts.stake})
						</button>
						<button
							onClick={() => setFilterType('other' as any)}
							className={`px-6 py-2 rounded-lg font-medium transition-all ${
								filterType === 'other'
									? 'bg-primary/10 text-primary border border-primary/20'
									: 'bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10'
							}`}
						>
							Other ({activityCounts.other})
						</button>
					</div>
				</Container>
			</section>

			{/* Activity Timeline */}
			<section className="section-padding">
				<Container size="lg">
					<Timeline
						items={filteredActivities.map(activity => ({
							...activity,
							icon: typeIcons[activity.type]
						}))}
						onItemClick={item => {
							// Navigate to detail page based on type
							console.log('Clicked:', item);
						}}
					/>

					{/* Load More */}
					{filteredActivities.length >= 10 && (
						<div className="mt-12 text-center">
							<button className="px-8 py-3 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary transition-all">
								Load More Activities
							</button>
						</div>
					)}
				</Container>
			</section>
		</div>
	);
}
