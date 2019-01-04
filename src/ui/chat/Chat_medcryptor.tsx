import React from 'react';
import { observer } from 'mobx-react';
import ChatList from './components/ChatList';

@observer
class Chat extends React.Component {
    render() {
        return (
            <div className="messages">
                <ChatList />
                {this.props.children}
            </div>
        );
    }
}

export default Chat;
