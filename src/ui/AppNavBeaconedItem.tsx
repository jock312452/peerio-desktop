import React from 'react';
import { observer } from 'mobx-react';
import { t } from 'peerio-icebear';

import uiStore from '~/stores/ui-store';
import beaconStore from '~/stores/beacon-store';
import Beacon from '~/ui/shared-components/Beacon';

import AppNavButton, { AppNavButtonProps } from './AppNavButton';

interface AppNavBeaconedItemProps extends AppNavButtonProps {
    beaconName: string;
    testId?: string;
}

@observer
export default class AppNavBeaconedItem extends React.Component<AppNavBeaconedItemProps> {
    // When Beacon is directly dismissed (rather than Beacon bubble being clicked), cancel remaining onboarding beacons
    cancelOnboardingBeacons() {
        if (uiStore.firstLogin) {
            beaconStore.markAsRead(['chat', 'files', 'contact']);
        }
    }

    onNavigateClick = () => {
        beaconStore.clearBeacons();
        this.cancelOnboardingBeacons();
        this.props.onClick();
    };

    render() {
        return (
            <Beacon
                type="spot"
                name={this.props.beaconName}
                title={t(`title_${this.props.beaconName}_beacon` as any)}
                description={t(`description_${this.props.beaconName}_beacon` as any)}
                size={48}
                className="appnav-beacon"
                onContentClick={this.props.onClick}
                onBeaconClick={this.cancelOnboardingBeacons}
            >
                <AppNavButton {...this.props} onClick={this.onNavigateClick} />
            </Beacon>
        );
    }
}
