import React from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

import { chatStore, chatInviteStore, t } from 'peerio-icebear';
import routerStore from '~/stores/router-store';

import css from 'classnames';
import FlipMove from 'react-flip-move';
import { List, ListItem, Tooltip } from 'peer-ui';
import PlusIcon from '~/ui/shared-components/PlusIcon';
import { getAttributeInParentChain } from '~/helpers/dom';
import T from '~/ui/shared-components/T';

@observer
export default class PatientList extends React.Component {
    newPatient = () => {
        chatStore.deactivateCurrentChat();
        chatInviteStore.deactivateInvite();
        routerStore.navigateTo(routerStore.ROUTES.newPatient);
    };

    activatePatient = (ev: React.MouseEvent<HTMLLIElement>) => {
        chatStore.deactivateCurrentChat();
        chatInviteStore.deactivateInvite();

        const spaceId = getAttributeInParentChain(ev.target as Element, 'data-chatid');
        chatStore.spaces.activeSpaceId = spaceId;
        routerStore.navigateTo(routerStore.ROUTES.patients);
    };

    // Buildling patient list
    // TODO: this will throw off `this.unreadPositions`!
    @computed
    get patientsMap() {
        return chatStore.spaces.spacesList.map(space => {
            let rightContent = null;
            if (space.isNew) {
                rightContent = <T k="title_new" className="badge-new" />;
            } else if (space.unreadCount > 0) {
                rightContent = (
                    <div className="notification">
                        {space.unreadCount < 100 ? space.unreadCount : '99+'}
                    </div>
                );
            }
            return (
                <ListItem
                    data-chatid={space.spaceId}
                    className={css('room-item', 'patient-item')}
                    onClick={this.activatePatient}
                    caption={space.spaceName}
                    key={space.spaceName}
                    rightContent={rightContent}
                />
            );
        });
    }

    render() {
        return (
            <List>
                <div>
                    <PlusIcon onClick={this.newPatient} label={t('mcr_title_patientFiles')} />
                    <Tooltip text={t('mcr_button_addPatient')} position="right" />
                </div>
                <FlipMove duration={200} easing="ease-in-out">
                    {routerStore.isNewPatient && (
                        <ListItem
                            key="new patient"
                            className="room-item new-room-entry active"
                            caption={`# ${t('mcr_title_newPatient')}`}
                        />
                    )}
                    {this.patientsMap}
                </FlipMove>
            </List>
        );
    }
}
