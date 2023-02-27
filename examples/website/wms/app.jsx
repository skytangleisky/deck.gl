import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import DeckGL from '@deck.gl/react';
import {_WMSLayer as WMSLayer, TerrainLayer} from '@deck.gl/geo-layers';
import {_TerrainExtension as TerrainExtension} from '@deck.gl/extensions';

const INITIAL_VIEW_STATE = {
  longitude: -122.4,
  latitude: 37.74,
  zoom: 9,
  pitch: 0,
  bearing: 0
};

const CONTROLLER = {
  // dragRotate: false,
  // touchRotate: false,
  maxPitch: 85,
  minZoom: 1,
  maxZoom: 20
};

const SAMPLE_SERVICE = {
  serviceUrl: `https://ows.terrestris.de/osm/service`,
  layers: ['OSM-WMS']
};

// const SAMPLE_SERVICE = {
//   serviceUrl: 'https://geo.weather.gc.ca/geomet',
//   layers: ['GDPS.ETA_TT'],
// };

export default function App({
  serviceUrl = SAMPLE_SERVICE.serviceUrl,
  layers = SAMPLE_SERVICE.layers,
  initialViewState = INITIAL_VIEW_STATE,
  onMetadataLoad = console.log
}) {
  const [selection, setSelection] = useState(null);

  const deckLayers = [
    new TerrainLayer({
      id: 'terrain',
      minZoom: 0,
      maxZoom: 23,
      strategy: 'no-overlap',
      elevationDecoder: {
        rScaler: 6553.6,
        gScaler: 25.6,
        bScaler: 0.1,
        offset: -10000
      },
      elevationData: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      // texture: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${MAPBOX_TOKEN}`,
      operation: 'terrain'
    }),
    new WMSLayer({
      data: serviceUrl,
      layers,
      pickable: true,

      extensions: [new TerrainExtension()],

      onMetadataLoad: onMetadataLoad,
      onMetadataLoadError: console.error,

      onClick: async ({bitmap, layer}) => {
        if (bitmap) {
          const x = bitmap.pixel[0];
          const y = bitmap.pixel[1];
          const featureInfo = await layer.getFeatureInfoText(x, y);
          setSelection({x, y, featureInfo});
        }
      }
    })
  ];

  return (
    <>
      <DeckGL
        layers={deckLayers}
        initialViewState={initialViewState}
        controller={CONTROLLER}
      />
      {selection && <div className="selected-feature-info" style={{left: selection.x, top: selection.y}} onPointerLeave={() => setSelection(null)}>
        {selection.featureInfo}
      </div>}
    </>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
