// Copyright 2022-2023 @Polkasafe/polkaSafe-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
/* eslint-disable sort-keys */

import { ApiPromise } from '@polkadot/api';
import { formatBalance } from '@polkadot/util/format';
import { encodeAddress } from '@polkadot/util-crypto';
import { chainProperties } from 'src/global/networkConstants';
import { SUBSCAN_API_HEADERS } from 'src/global/subscan_consts';
import { IMultisigAddress, UserDetailsContextType } from 'src/types';
import queueNotification from 'src/ui-components/QueueNotification';
import { NotificationStatus } from 'src/ui-components/types';

import { calcWeight } from './calcWeight';
import { getMultisigInfo } from './getMultisigInfo';
import sendNotificationToAddresses from './sendNotificationToAddresses';
import updateTransactionNote from './updateTransactionNote';

interface Args {
	api: ApiPromise,
	network: string,
	multisig: IMultisigAddress,
	callDataHex?: string,
	callHash: string,
	approvingAddress: string,
	note: string,
	setLoadingMessages: React.Dispatch<React.SetStateAction<string>>
	setUserDetailsContextState: React.Dispatch<React.SetStateAction<UserDetailsContextType>>
}

export async function approveProxy ({ api, approvingAddress, callDataHex, callHash, multisig, network, note, setLoadingMessages, setUserDetailsContextState }: Args) {
	// 1. Use formatBalance to display amounts
	formatBalance.setDefaults({
		decimals: chainProperties[network].tokenDecimals,
		unit: chainProperties[network].tokenSymbol
	});

	// 2. Set relevant vars
	const ZERO_WEIGHT = new Uint8Array(0);
	let WEIGHT: any = ZERO_WEIGHT;

	// remove approving address address from signatories
	const otherSignatories = multisig.signatories.sort().filter((signatory) => signatory !== approvingAddress);

	if(callDataHex) {

		const callData = api.createType('Call', callDataHex);
		const { weight } = await calcWeight(callData, api);
		WEIGHT = weight;

		// invalid call data for this call hash
		if (!callData.hash.eq(callHash)) {
			return;
		}
	}

	const multisigInfos = await getMultisigInfo(multisig.address, api);
	const [, multisigInfo] = multisigInfos?.find(([h]) => h.eq(callHash)) || [null, null];

	if(!multisigInfo) {
		console.log('No multisig info found');
		return;
	}

	console.log(`Time point is: ${multisigInfo?.when}`);

	const numApprovals = multisigInfo.approvals.length;

	const fetchProxyData = async () => {
		const response = await fetch(
			`https://${network}.api.subscan.io/api/scan/events`,
			{
				body: JSON.stringify({
					row: 1,
					page: 0,
					module: 'proxy',
					call: 'PureCreated',
					address: multisig.address
				}),
				headers: SUBSCAN_API_HEADERS,
				method: 'POST'
			}
		);

		const responseJSON = await response.json();
		if(responseJSON.data.count === 0){
			setUserDetailsContextState((prev) => ({
				...prev,
				isProxy: false
			}));
		}
		else{
			const params = JSON.parse(responseJSON.data?.events[0]?.params);
			const proxyAddress = encodeAddress(params[0].value, 42);
			const multisigAddress = encodeAddress(params[1].value, 42);
			console.log('proxy', proxyAddress);
			setUserDetailsContextState((prev) => {
				const copyMultisigs = [...prev.multisigAddresses];
				const copyMultisigObject = copyMultisigs?.find((item) => item.address === multisigAddress);
				if(copyMultisigObject){
					copyMultisigObject.proxy = proxyAddress;
				}
				return {
					...prev,
					isProxy: true,
					multisigAddresses: copyMultisigs
				};
			});
		}
	};

	return new Promise<void>((resolve, reject) => {

		// 5. Send asMulti if last approval call
		if (numApprovals < multisig.threshold - 1) {
			api.tx.multisig
				.approveAsMulti(multisig.threshold, otherSignatories, multisigInfo.when, callHash, ZERO_WEIGHT)
				.signAndSend(approvingAddress, async ({ status, txHash, events }) => {
					if (status.isInvalid) {
						console.log('Transaction invalid');
						setLoadingMessages('Transaction invalid');
					} else if (status.isReady) {
						console.log('Transaction is ready');
						setLoadingMessages('Transaction is ready');
					} else if (status.isBroadcast) {
						console.log('Transaction has been broadcasted');
						setLoadingMessages('Transaction has been broadcasted');
					} else if (status.isInBlock) {
						console.log('Transaction is in block');
						setLoadingMessages('Transaction is in block');
					} else if (status.isFinalized) {
						console.log(`Transaction has been included in blockHash ${status.asFinalized.toHex()}`);
						console.log(`approveAsMulti tx: https://${network}.subscan.io/extrinsic/${txHash}`);

						for (const { event } of events) {
							if (event.method === 'ExtrinsicSuccess') {
								queueNotification({
									header: 'Success!',
									message: 'Transaction Successful.',
									status: NotificationStatus.SUCCESS
								});
								resolve();
							} else if (event.method === 'ExtrinsicFailed') {
								console.log('Transaction failed');

								const errorModule = (event.data as any)?.dispatchError?.asModule;
								const { method, section, docs } = api.registry.findMetaError(errorModule);
								console.log(`Error: ${section}.${method}\n${docs.join(' ')}`);

								queueNotification({
									header: `Error! ${section}.${method}`,
									message: `${docs.join(' ')}`,
									status: NotificationStatus.ERROR
								});
								reject(`Error: ${section}.${method}\n${docs.join(' ')}`);
							}
						}
					}
				}).catch((error) => {
					console.log(error);
					reject(error);
				});
		} else {
			console.log('multisig info', multisigInfo);
			api.tx.multisig
				.asMulti(multisig.threshold, otherSignatories, multisigInfo.when, callDataHex || '', WEIGHT as any)
				.signAndSend(approvingAddress, async ({ status, txHash, events }) => {
					if (status.isInvalid) {
						console.log('Transaction invalid');
						setLoadingMessages('Transaction invalid');
					} else if (status.isReady) {
						console.log('Transaction is ready');
						setLoadingMessages('Transaction is ready');
					} else if (status.isBroadcast) {
						console.log('Transaction has been broadcasted');
						setLoadingMessages('Transaction has been broadcasted');
					} else if (status.isInBlock) {
						console.log('Transaction is in block');
						setLoadingMessages('Transaction is in block');
					} else if (status.isFinalized) {
						console.log(`Transaction has been included in blockHash ${status.asFinalized.toHex()}`);
						console.log(`asMulti tx: https://${network}.subscan.io/extrinsic/${txHash}`);

						for (const { event } of events) {
							if (event.method === 'ExtrinsicSuccess') {
								queueNotification({
									header: 'Success!',
									message: 'Transaction Successful.',
									status: NotificationStatus.SUCCESS
								});
								fetchProxyData();

								resolve();

								// update note for transaction history
								updateTransactionNote({ callHash: txHash.toHex(), multisigAddress: multisig.address, network, note });

								sendNotificationToAddresses({
									addresses: otherSignatories,
									link: `/transactions?tab=History#${txHash.toHex()}`,
									message: 'Transaction Executed!',
									network,
									type: 'sent'
								});
							} else if (event.method === 'ExtrinsicFailed') {
								console.log('Transaction failed');

								const errorModule = (event.data as any)?.dispatchError?.asModule;
								if(!errorModule) {
									queueNotification({
										header: 'Error!',
										message: 'Transaction Failed',
										status: NotificationStatus.ERROR
									});
									reject('Transaction Failed');
									return;
								}

								const { method, section, docs } = api.registry.findMetaError(errorModule);
								console.log(`Error: ${section}.${method}\n${docs?.join(' ')}`);

								queueNotification({
									header: `Error! ${section}.${method}`,
									message: `${docs.join(' ')}`,
									status: NotificationStatus.ERROR
								});
								reject(`Error: ${section}.${method}\n${docs.join(' ')}`);
							}
						}
					}
				}).catch((error) => {
					console.log(error);
					queueNotification({
						header: 'Failed!',
						message: error.message,
						status: NotificationStatus.ERROR
					});
					reject(error);
				});
		}

		console.log(`Submitted values: asMulti(${multisig.threshold}, otherSignatories: ${JSON.stringify(otherSignatories, null, 2)}, ${multisigInfo?.when}, ${callDataHex}, ${WEIGHT})\n`);
	});
}
