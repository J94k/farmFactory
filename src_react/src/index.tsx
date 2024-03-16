import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ElementWithDataset extends Element {
  dataset: DOMStringMap;
}

const widgets: NodeListOf<ElementWithDataset> = document.querySelectorAll('.ff-farmfactory-widget')
widgets.forEach((widget) => {
  try {
    const props: Record<string, string | undefined> = {}
    Object.keys(widget.dataset).forEach((key) => {
      props[key] = widget.dataset[key]
    })
    const widgetRoot = ReactDOM.createRoot(widget)
    widgetRoot.render(
      <React.StrictMode>
        <App widgetOptions={props} />
      </React.StrictMode>
    );
  } catch (err) {
    console.log('FarmFactory - Fail init widget', widget)
  }
})
