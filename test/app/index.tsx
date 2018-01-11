import React from 'react'
import { FormattedMessage } from 'react-intl'
import messages from './defineMessages'

export class App extends React.Component<any, any>{
    render() {
        return <div>
            <FormattedMessage id="app" defaultMessage="the defualt message" />
            <FormattedMessage {...messages.intro} />
            <FormattedMessage id="expr" defaultMessage={"a jsx expression"} />

            {/* Not currently supported: <FormattedMessage id="concat" defaultMessage={"concatenated " + "strings"} /> */}
        </div>
    }
}

export function wrapperFunc<Props, State, CompState>(
    WrappedComponent: typeof React.Component,
): React.ComponentClass<Props & State> {
    return class extends React.Component<Props & State, CompState> {
        public render() {
            return <WrappedComponent {...this.props} {...this.state} />;
        }
    };
}

const D = wrapperFunc<{ id: number }, {}, any>(App)

export default D
