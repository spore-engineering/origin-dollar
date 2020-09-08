import React from 'react'
import sentry from 'utils/sentry'

const { Sentry, captureException } = sentry()

const withErrorBoundary = (WrappedComponent) => {
  class WithErrorBoundary extends React.Component {
    constructor(props) {
      super(props)
    }

    componentDidCatch(error, errorInfo) {
      const errorEventId = captureException(error, { errorInfo })

      console.error('CAUGHT ERROR', errorEventId)

      if (Sentry && typeof Sentry.showReportDialog === 'function') {
        Sentry.showReportDialog({ eventId: errorEventId })
      }
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }

  return WithErrorBoundary
}

export default withErrorBoundary
