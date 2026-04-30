'use client';

import { useLayoutEffect, useState, type ReactNode } from 'react';

/**
 * Pushes page content below the fixed `<Header />` by matching its rendered height
 * (nav + optional maintenance banner). Static `pt-*` alone drifts from real height
 * and lets the header overlap the first section (e.g. play page countdown row).
 */
export function MainWithHeaderOffset({ children }: { children: ReactNode }) {
	// SSR / first paint: safe default close to typical header (nav + border)
	const [offsetPx, setOffsetPx] = useState(80);

	useLayoutEffect(() => {
		const header = document.querySelector('header');
		if (!header) return;

		const apply = () => {
			setOffsetPx(header.getBoundingClientRect().height);
		};

		apply();
		const ro = new ResizeObserver(apply);
		ro.observe(header);
		window.addEventListener('resize', apply);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', apply);
		};
	}, []);

	return (
		<main className="flex-1" style={{ paddingTop: offsetPx }}>
			{children}
		</main>
	);
}
