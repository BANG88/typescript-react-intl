import React from 'react'
import { FormattedMessage } from 'react-intl'
import messages from './defineMessages'

/**
 * Intro
 * @param param0 
 */
export const Intro = ({ message }: { message: string }) => <div>
    <h1>hello {message}</h1>
    <FormattedMessage id="i.am.ok" defaultMessage="yep" />
    <FormattedMessage {...messages.intro} />
</div>
