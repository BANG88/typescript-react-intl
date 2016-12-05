import React from 'react'
import {FormattedMessage} from 'react-intl'
export default class App extends React.Component<any, any>{
    render() {
        return <div>
        <FormattedMessage id="app" defaultMessage="the defualt message"/>
        </div>
    }
}