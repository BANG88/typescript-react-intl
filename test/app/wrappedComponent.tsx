import React from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import messages from './defineMessages'

class WrappedComponent extends React.Component<any, any>{
    render() {
        const { formatMessage } = this.props.intl;

        const emailPlaceholder = formatMessage({
            id: "emailPlaceholder",
            defaultMessage: "Email"
        });

        const formatMessageWithStringKeys = formatMessage({
            "id": "anotherPlaceholder",
            "defaultMessage": "Name"
        });

        return <div>
            <input type="text" placeholder={emailPlaceholder} />
        </div>
    }
}

export default injectIntl(WrappedComponent);