// Copyright 2022-2023 @Polkasafe/polkaSafe-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ApiPromise } from '@polkadot/api';
import type { Call } from '@polkadot/types/interfaces';
import type { CallFunction } from '@polkadot/types/types';
import { formatBalance } from '@polkadot/util/format';
import BN from 'bn.js';
import { chainProperties } from 'src/global/networkConstants';
import { IMultisigAddress } from 'src/types';
import queueNotification from 'src/ui-components/QueueNotification';
import { NotificationStatus } from 'src/ui-components/types';

import { calcWeight } from './calcWeight';
import { getMultisigInfo } from './getMultisigInfo';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CallData {
  callData: Call | null;
  callError: string | null;
  callInfo: CallFunction | null;
}

interface Props {
	api: ApiPromise,
	network: string,
	multisig: IMultisigAddress,
	callDataHex: string,
	callHash: string,
	amount: BN,
	approvingAddress: string,
	recipientAddress: string,
}

export async function approveMultisigTransfer ({ amount, api, approvingAddress, callDataHex, callHash, recipientAddress, multisig, network }: Props) {
	// 1. Use formatBalance to display amounts
	formatBalance.setDefaults({
		decimals: chainProperties[network].tokenDecimals,
		unit: chainProperties[network].tokenSymbol
	});

	const callData = api.createType('Call', callDataHex);
	const { weight: MAX_WEIGHT } = await calcWeight(callData, api);

	// invalid call data for this call hash
	if (!callData.hash.eq(callHash)) return;

	// 2. Set relevant constants
	const ZERO_MAX_WEIGHT = new Uint8Array(0);
	const AMOUNT_TO_SEND = amount.toNumber();
	const displayAmount = formatBalance(AMOUNT_TO_SEND);

	// remove approving address address from signatories
	const otherSignatories = multisig.signatories.sort().filter((signatory) => signatory !== approvingAddress);

	// 3. tx call
	const call = api.tx.balances.transferKeepAlive(recipientAddress, AMOUNT_TO_SEND);

	const multisigInfos = await getMultisigInfo(multisig.address, api);
	const [, multisigInfo] = multisigInfos?.find(([h]) => h.eq(callHash)) || [null, null];

	if(!multisigInfo) return;

	console.log(`Time point is: ${multisigInfo?.when}`);

	const numApprovals = multisigInfo.approvals.length;

	return new Promise<void>((resolve, reject) => {

		// 5. Send asMulti if last approval call
		if (numApprovals < multisig.threshold - 1) {
			api.tx.multisig
				.approveAsMulti(multisig.threshold, otherSignatories, multisigInfo.when, call.method.toHex(), ZERO_MAX_WEIGHT)
				.signAndSend(approvingAddress, async ({ status, txHash, events }) => {
					if (status.isInvalid) {
						console.log('Transaction invalid');
					} else if (status.isReady) {
						console.log('Transaction is ready');
					} else if (status.isBroadcast) {
						console.log('Transaction has been broadcasted');
					} else if (status.isInBlock) {
						console.log('Transaction is in block');
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
								queueNotification({
									header: 'Error!',
									message: 'Transaction Failed',
									status: NotificationStatus.ERROR
								});
								reject();
							}
						}
					}
				});
		} else {
			api.tx.multisig
				.asMulti(multisig.threshold, otherSignatories, multisigInfo.when, call.method.toHex(), MAX_WEIGHT as any)
				.signAndSend(approvingAddress, async ({ status, txHash, events }) => {
					if (status.isInvalid) {
						console.log('Transaction invalid');
					} else if (status.isReady) {
						console.log('Transaction is ready');
					} else if (status.isBroadcast) {
						console.log('Transaction has been broadcasted');
					} else if (status.isInBlock) {
						console.log('Transaction is in block');
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

								// TODO: send notification

								resolve();
							} else if (event.method === 'ExtrinsicFailed') {
								console.log('Transaction failed');
								queueNotification({
									header: 'Error!',
									message: 'Transaction Failed',
									status: NotificationStatus.ERROR
								});
								reject();
							}
						}
					}
				});
		}

		console.log(`Sending ${displayAmount} from ${multisig.address} to ${recipientAddress}`);
		console.log(`Submitted values: asMulti(${multisig.threshold}, otherSignatories: ${JSON.stringify(otherSignatories, null, 2)}, ${multisigInfo?.when}, ${call.method.hash}, ${MAX_WEIGHT})\n`);
	});
}
