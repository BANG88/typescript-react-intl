import { defineMessages } from 'react-intl'

const lang = defineMessages({
    intro: {
        id: 'intro.hello',
        defaultMessage: "Hello world"
    },
    "title": {
        "id": 'app.title',
        "defaultMessage": "Hello"
    },
})

// NB not a variable declaration; should be ignored
defineMessages({
    ignored: {
        id: 'ignored.title',
        defaultMessage: "Ignore me"
    },
})

export default lang