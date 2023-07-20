// Copyright 2022-2023 @Polkasafe/polkaSafe-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Button } from 'antd';
import { Input } from 'antd';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AddAdress from 'src/components/AddressBook/AddAddress';
import AddressTable from 'src/components/AddressBook/AddressTable';
import ExportAdress from 'src/components/AddressBook/ExportAddress';
import ImportAdress from 'src/components/AddressBook/ImportAddress';
import { useActiveMultisigContext } from 'src/context/ActiveMultisigContext';
import { useModalContext } from 'src/context/ModalContext';
import { useGlobalUserDetailsContext } from 'src/context/UserDetailsContext';
import { ISharedAddressBookRecord } from 'src/types';
import { ExternalLinkIcon, SearchIcon } from 'src/ui-components/CustomIcons';
import { AddBoxIcon, ExportArrowIcon, ImportArrowIcon } from 'src/ui-components/CustomIcons';

enum ETab {
	SHARED,
	PERSONAL
}

const AddressBook = ({ className }: { className?: string }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const { addressBook } = useGlobalUserDetailsContext();
	const { records } = useActiveMultisigContext();
	const [tab, setTab] = useState<ETab>(ETab.SHARED);
	const personalAddressBookFiltered = addressBook.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())||item.address.toLowerCase().includes(searchTerm.toLowerCase()));
	const [sharedAddressBookFiltered, setSharedAddressBookFiltered] = useState<{ [address: string]: ISharedAddressBookRecord }>({} as any);
	useEffect(() => {
		if(!records) return;
		Object.keys(records)?.filter(address => records[address]?.name.toLowerCase().includes(searchTerm.toLowerCase())|| records[address]?.address.toLowerCase().includes(searchTerm.toLowerCase()) || records[address]?.roles?.includes(searchTerm)).forEach((address) => {
			setSharedAddressBookFiltered(prev => {
				return {
					...prev,
					[address]: {
						address: records[address]?.address,
						discord: records[address]?.discord,
						email: records[address]?.email,
						name: records[address].name,
						roles: records[address]?.roles,
						telegram: records[address]?.telegram
					}

				};
			});
		});
	}, [records, searchTerm, sharedAddressBookFiltered]);
	const { openModal } = useModalContext();
	const userAddress = localStorage.getItem('address');
	return (
		<div className='scale-[80%] w-[125%] h-[125%] p-5 origin-top-left bg-bg-main rounded-lg'>
			{userAddress ?
				<div>
					<div className="flex items-center justify-between">
						<div className='rounded-lg bg-bg-secondary flex items-center mb-4 p-1 text-xs gap-x-2 md:gap-x-4 md:text-sm'>
							<SearchIcon className='text-primary pl-3 pr-0' />
							<Input className= 'bg-bg-secondary placeholder-text_placeholder text-white outline-none border-none min-w-[300px]' placeholder='Search by name or address' value={searchTerm} onChange={e => setSearchTerm(e.target.value)}>
							</Input>
						</div>
						<div className='flex'>
							<Button className='flex items-center justify-center bg-highlight text-primary mr-2 border-none' onClick={() => openModal('Import Address Book', <ImportAdress/>) }><ImportArrowIcon/>Import</Button>
							<Button className='flex items-center justify-center bg-highlight text-primary mr-2 border-none' onClick={() => openModal('Export Address Book', <ExportAdress records={sharedAddressBookFiltered} />) }><ExportArrowIcon/>Export</Button>
							<Button className='flex items-center justify-center bg-primary text-white border-none' onClick={() => openModal('Add Address', <AddAdress className={className} />)}><AddBoxIcon/> Add Address</Button>
						</div>
					</div>
					<div>
						<AddressTable setTab={setTab} tab={tab} personalAddresses={personalAddressBookFiltered} records={ sharedAddressBookFiltered } />
					</div>
				</div>
				: <div className='h-full w-full flex items-center justify-center text-primary font-bold text-lg'>
					<Link to='/'><span>Please Login</span> <ExternalLinkIcon /></Link>
				</div>
			}
		</div>
	);
};

export default AddressBook;