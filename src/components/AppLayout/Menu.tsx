// Copyright 2022-2023 @Polkasafe/polkaSafe-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import classNames from 'classnames';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import polkasafeLogo from 'src/assets/icons/polkasafe.svg';
import { AddressBookIcon, AppsIcon, AssetsIcon, HomeIcon, KeyIcon, MultisigLockIcon, SettingsIcon, TransactionIcon, UserPlusIcon } from 'src/ui-components/CustomIcons';
import styled from 'styled-components';

import { IRouteInfo } from '.';

const menuItems = [
	{
		icon: <HomeIcon />,
		key: '/',
		title: 'Home'
	},
	{
		icon: <AssetsIcon />,
		key: '/assets',
		title: 'Assets'
	},
	{
		icon: <TransactionIcon />,
		key: '/transactions',
		title: 'Transactions'
	},
	{
		icon: <AddressBookIcon />,
		key: '/address-book',
		title: 'Address Book'
	},
	{
		icon: <AppsIcon />,
		key: '/apps',
		title: 'Apps'
	},
	{
		icon: <SettingsIcon />,
		key: '/settings',
		title: 'Settings'
	}
];

interface Props {
	className?: string;
	selectedRoute: IRouteInfo;
	setSelectedRoute: React.Dispatch<React.SetStateAction<IRouteInfo>>;
}

const Menu: FC<Props> = ({ className, selectedRoute, setSelectedRoute }) => {
	const addresses = [
		{
			address: 'John'
		},
		{
			address: 'John Doe'
		},
		{
			address: 'John John'
		}
	];

	return (
		<div className={classNames(className, 'bg-bg-main')}>
			<section className='mt-[30px] mb-10'>
				<Link to='/'>
					<p className='text-white flex items-center gap-x-2 overflow-hidden justify-center'>
						<img src={polkasafeLogo} alt="polkasafe logo" />
					</p>
				</Link>
			</section>
			<section className='text-white'>
				<h2 className='uppercase text-text_secondary ml-8 text-xs font-primary'>
					Menu
				</h2>
				<ul className='flex flex-col py-2'>
					{
						menuItems.map((item) => {
							return <li className='w-full px-5' key={item.key}>
								<Link className={classNames('flex items-center gap-x-2 flex-1 rounded-lg p-3 font-medium text-base', {
									'bg-highlight text-primary': item.title === selectedRoute.title
								})} onClick={() => setSelectedRoute({
									pathName: item.key,
									title: item.title
								})} to={item.key} >
									{item.icon}
									{item.title}
								</Link>
							</li>;
						})
					}
				</ul>
			</section>
			<section>
				<h2 className='px-6 flex items-center gap-x-2'>
					<MultisigLockIcon className='text-lg' />
					<span className='font-bold text-lg'>Your Multisigs</span>
				</h2>
				<div>
					<ul className='flex flex-col py-2'>
						{addresses.map(({ address }) => {
							return <li className='w-full pr-5' key={address}>
								<Link className='flex items-center gap-x-3 menu-item-active' to={address} >
									<p className='w-[5px] h-8'></p>
									<p className='px-3 py-1.5 font-normal text-base text-blue_secondary flex items-center gap-x-2 flex-1 rounded-md'>
										<KeyIcon />
										{address}
									</p>
								</Link>
							</li>;
						})}
					</ul>
					<div className='px-5 py-2'>
						<Link to='/create-multisig'>
							<article className='flex flex-col items-center gap-y-4 pt-8 pb-6 rounded-md bg-gradient-primary shadow-siderBox'>
								<UserPlusIcon className='text-5xl' />
								<p className='text-white max-w-[100px] text-center font-bold'>
									Add New Multisig
								</p>
							</article>
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
};

export default styled(Menu)``;
