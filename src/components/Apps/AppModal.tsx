// Copyright 2022-2023 @Polkasafe/polkaSafe-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React from 'react';
import subid from 'src/assets/subid.svg';
import { useGlobalDAppContext } from 'src/context/DAppContext';
import { useModalContext } from 'src/context/ModalContext';
import { networks } from 'src/global/networkConstants';
import { ArrowRightIcon } from 'src/ui-components/CustomIcons';
const AppModal = () => {
	const { setIframeVisibility } = useGlobalDAppContext();
	const { closeModal } = useModalContext();
	return (
		<>
			<div className={'flex flex-col cursor-pointer rounded-lg scale-90 origin-top-left w-[100%] h-[100%] my-[-25px] justify-between gap-[40px]'} >
				<div className='flex flex-col overflow-auto w-[100%] gap-[20px] '>
					<img src={subid} alt="" height='70' width='60' />
					<div className='flex flex-col gap-3'>
						<div className="text-3xl text-white font-bold">Sub ID</div>
						<div className='text-[#8B8B8B] font-medium text-14 leading-tight font-archivo'>One Stop Shop For All Substrate Addresses And Balances</div>
					</div>
					<div className='flex flex-col gap-3'>
						<div className='text-[#8B8B8B] font-medium text-base text-14 leading-tight font-archivo'>Available networks</div>
						<div className='flex gap-2 flex-wrap max-w-[400px]'>
							{Object.values(networks).map((net) =>
								<button key={net} className='rounded-lg py-2 px-[10px] text-sm leading-[15px] text-white text-primary bg-highlight'> {net} </button>
							)}
						</div>
					</div>
				</div>
				<button className='mt-auto text-white bg-primary p-3 rounded-lg w-full flex items-center justify-center gap-x-1 cursor-pointer'
					onClick={() => {
						closeModal();
						setIframeVisibility(true);
					}}
				>
					<span className='font-medium text-xs'>Open app</span>
					<ArrowRightIcon className='text-sm' />
				</button>
			</div>
		</>
	);
};
export default AppModal;