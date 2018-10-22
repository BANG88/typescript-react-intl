import React from "react";
import { FormattedMessage } from "react-intl";
export class MyComponent extends React.Component<FormattedMessage.Props,{}> {
  // tslint:disable-next-line:member-access
  render() {
    return <FormattedMessage {...this.props}>
	{
		text => <span>{text}</span>
	}
	</FormattedMessage>;
  }
}
