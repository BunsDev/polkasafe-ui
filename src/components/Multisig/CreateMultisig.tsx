// Copyright 2022-2023 @Polkasafe/polkaSafe-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
/* eslint-disable sort-keys */

// import { PlusCircleOutlined } from '@ant-design/icons';
import { Form, Input, InputNumber, Modal, Switch } from 'antd';
import classNames from 'classnames';
import React, { FC, useEffect, useState } from 'react';
import CancelBtn from 'src/components/Multisig/CancelBtn';
import AddBtn from 'src/components/Multisig/ModalBtn';
import { useGlobalApiContext } from 'src/context/ApiContext';
import { useModalContext } from 'src/context/ModalContext';
import { useGlobalUserDetailsContext } from 'src/context/UserDetailsContext';
import { DEFAULT_ADDRESS_NAME } from 'src/global/default';
import { firebaseFunctionsHeader } from 'src/global/firebaseFunctionsHeader';
import { FIREBASE_FUNCTIONS_URL } from 'src/global/firebaseFunctionsUrl';
import useGetAllAccounts from 'src/hooks/useGetAllAccounts';
import { IAddressBookItem, IMultisigAddress } from 'src/types';
import { DashDotIcon } from 'src/ui-components/CustomIcons';
import PrimaryButton from 'src/ui-components/PrimaryButton';
import queueNotification from 'src/ui-components/QueueNotification';
import { NotificationStatus } from 'src/ui-components/types';
import styled from 'styled-components';

import AddAddress from '../AddressBook/AddAddress';
import DragDrop from '../Multisig/DragDrop';
import Search from '../Multisig/Search';
import Signatory from './Signatory';

interface IMultisigProps {
	className?: string
	onCancel?: () => void
	isModalPopup?:boolean
	homepage?: boolean
}

const CreateMultisig: React.FC<IMultisigProps> = ({ onCancel, homepage=false }) => {
	const { setUserDetailsContextState, addressBook, address: userAddress, multisigAddresses } = useGlobalUserDetailsContext();
	const { network } = useGlobalApiContext();

	const { toggleVisibility, toggleSwitch, toggleOnSwitch } = useModalContext();
	const [multisigName, setMultisigName] = useState<string>('');
	const [threshold, setThreshold] = useState<number | null>(2);
	const [signatories, setSignatories] = useState<string[]>([userAddress]);

	const { accounts, noAccounts } = useGetAllAccounts();
	const [address, setAddress] = useState('');
	const [loading, setLoading] = useState<boolean>(false);
	const [addAddress, setAddAddress] = useState<string>('');
	const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
	const [form] = Form.useForm();

	useEffect(() => {
		if (accounts && accounts.length > 0 && !address) {
			setAddress(accounts[0].address);
		}
	}, [accounts, address]);

	const handleAddAddress = async (address: string, name: string) => {
		try{
			const userAddress = localStorage.getItem('address');
			const signature = localStorage.getItem('signature');

			if(!userAddress || !signature) {
				console.log('ERROR');
				return;
			}
			else{
				if(addressBook.some((item) => item.address === address)){
					return;
				}

				const addAddressRes = await fetch(`${FIREBASE_FUNCTIONS_URL}/addToAddressBook`, {
					body: JSON.stringify({
						address,
						name
					}),
					headers: firebaseFunctionsHeader(network),
					method: 'POST'
				});

				const { data: addAddressData, error: addAddressError } = await addAddressRes.json() as { data: IAddressBookItem[], error: string };

				if(addAddressError) {

					queueNotification({
						header: 'Error!',
						message: addAddressError,
						status: NotificationStatus.ERROR
					});
					return;
				}

				if(addAddressData){
					setUserDetailsContextState((prevState) => {
						return {
							...prevState,
							addressBook: addAddressData
						};
					});

				}

			}
		} catch (error){
			console.log('ERROR', error);
			setLoading(false);
		}
	};

	const handleMultisigCreate = async () => {
		try{
			setLoading(true);
			const address = localStorage.getItem('address');
			const signature = localStorage.getItem('signature');

			if(!address || !signature || noAccounts) {
				console.log('ERROR');
				setLoading(false);
				return;
			}
			else{
				const createMultisigRes = await fetch(`${FIREBASE_FUNCTIONS_URL}/createMultisig`, {
					body: JSON.stringify({
						signatories,
						threshold,
						multisigName
					}),
					headers: firebaseFunctionsHeader(network, address, signature),
					method: 'POST'
				});

				const { data: multisigData, error: multisigError } = await createMultisigRes.json() as { error: string; data: IMultisigAddress};

				if(multisigError) {
					queueNotification({
						header: 'Error!',
						message: multisigError,
						status: NotificationStatus.ERROR
					});
					setLoading(false);
					return;
				}

				if(multisigData){
					if(multisigAddresses?.some((item) => item.address === multisigData.address)){
						queueNotification({
							header: 'Multisig Exist!',
							message: 'Please try adding a different multisig.',
							status: NotificationStatus.WARNING
						});
						setLoading(false);
						return;
					}
					setUserDetailsContextState((prevState) => {
						return {
							...prevState,
							multisigAddresses: [...(prevState?.multisigAddresses || []), multisigData]
						};
					});
					Promise.all(signatories.map(
						(signatory) => handleAddAddress(signatory, DEFAULT_ADDRESS_NAME)
					)).then(() => {
						queueNotification({
							header: 'Success!',
							message: `Your Multisig ${multisigName} has been created successfully!`,
							status: NotificationStatus.SUCCESS
						});
						setLoading(false);
						if(!homepage){
							toggleVisibility();
						}
					});

				}

			}
		} catch (error){
			console.log('ERROR', error);
		}
	};

	const AddAddressModal: FC = () => {
		return (
			<>
				<PrimaryButton onClick={() => setShowAddressModal(true)} className='bg-primary text-white w-fit'>
					<p className='font-normal text-sm'>Add</p>
				</PrimaryButton>
				<Modal width={600} onCancel={() => setShowAddressModal(false)} footer={null} open={showAddressModal}>
					<AddAddress onCancel={() => setShowAddressModal(false)} addAddress={addAddress} setAddAddress={setAddAddress} />
				</Modal>
			</>
		);
	};

	return (
		<Form
			form={form}
			validateMessages={
				{ required: "Please add the '${name}'" }
			}
		>
			<div className='flex flex-col relative'>
				<div className={classNames(
					`${homepage ? '' : 'w-[80vw]'}  flex justify-between items-end`,
					{
						'w-auto':onCancel
					}
				)}>
					<div className='relative'>
						<div className='flex items-center justify-between'>
							{toggleSwitch?<div className="flex items-center justify-between w-[45vw] gap-x-4">
								<Search addAddress={addAddress} setAddAddress={setAddAddress} />
								<AddAddressModal/>
							</div>:null}
							<div className='flex items-center justify-center absolute top-1 right-1'>
								<p className='mx-2 text-white'>Upload JSON file with signatories</p><Switch size="small" onChange={toggleOnSwitch}/>
							</div>
						</div>
						<div className="poition-absolute top-0 right-0"></div>
						<div className='flex items-center justify-between'>
							<Form.Item
								name="signatories"
								rules={[{ required: true }]}
								help={signatories.length < 2 && 'Multisig Must Have Atleast 2 Signatories.'}
								className='border-0 outline-0 my-0 p-0'
								validateStatus={signatories.length < 2 ? 'error' : 'success'}
							>
								{toggleSwitch? <Signatory homepage={homepage} filterAddress={addAddress} setSignatories={setSignatories} signatories={signatories}/> : <DragDrop setSignatories={setSignatories} />}
							</Form.Item>
							<DashDotIcon className='mt-5'/>
							<div className='w-[40%] overflow-auto'>
								<br />
								{toggleSwitch? <p className='bg-bg-secondary p-5 rounded-md mx-2 h-fit text-text_secondary'>The signatories has the ability to create transactions using the multisig and approve transactions sent by others. Once the threshold is reached with approvals, the multisig transaction is enacted on-chain.
							Since the multisig function like any other account, once created it is available for selection anywhere accounts are used and needs to be funded before use.
								</p> : <p className='bg-bg-secondary p-5 rounded-md mx-2 h-fit text-text_secondary'>Supply a JSON file with the list of signatories.</p>}
							</div>
						</div>
						<div className='flex items-start justify-between'>
							<Form.Item
								name="threshold"
								rules={[{ required: true }]}
								help={(!threshold || threshold < 2) && 'Threshold Must Be More Than 1.'}
								className='border-0 outline-0 my-0 p-0'
								validateStatus={(!threshold || threshold < 2) ? 'error' : 'success'}
							>
								<div className='w-[45vw]'>
									<p className='text-primary'>Threshold</p>
									<InputNumber onChange={(val) => setThreshold(val)} value={threshold} className= 'bg-bg-secondary placeholder:text-[#505050] text-white outline-none border-none w-full mt-2 py-2' placeholder='0' />
								</div>
							</Form.Item>
							<DashDotIcon className='mt-5'/>
							<div className='w-[40%] overflow-auto'>
								<p className='bg-bg-secondary py-2 px-5 rounded-md mx-2 mt-5 text-text_secondary'>The threshold for approval should be less or equal to the number of signatories for this multisig.</p>
							</div>
						</div>
						<div className='flex items-center justify-between'>
							<div className='w-[45vw]'>
								<p className='text-primary'>Name</p>
								<Input onChange={(e) => setMultisigName(e.target.value)} value={multisigName}  className= 'bg-bg-secondary placeholder-text_placeholder text-white outline-none border-none w-full mt-2 py-2' placeholder='Give the MultiSig a unique name' />
							</div>
							<DashDotIcon className='mt-5'/>
							<div className='w-[40%] overflow-auto'>
								<p className='bg-bg-secondary py-2 px-5 rounded-md mx-2 mt-5 text-text_secondary'>The name is for unique identification of the account in your owner lists.</p>
							</div>
						</div>
					</div>
				</div>
				<div className='flex items-center justify-center gap-x-5 mt-[40px]'>
					<CancelBtn onClick={onCancel? onCancel:toggleVisibility}/>
					<AddBtn disabled={signatories.length < 2 || !threshold || threshold < 2} loading={loading} title='Create Multisig' onClick={handleMultisigCreate} />
				</div>
			</div>
		</Form>
	);
};

export default styled(CreateMultisig)`
	.ant-switch-inner-checked {
		background-color: #645ADF !important;
	}
`;
