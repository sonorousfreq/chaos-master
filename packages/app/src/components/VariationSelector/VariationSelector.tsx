import { createSignal, For } from 'solid-js'
import { vec2f, vec4f } from 'typegpu/data'
import { tid, vid } from '@/flame/examples/util'
import { Flam3 } from '@/flame/Flam3'
import { generateVariationId } from '@/flame/transformFunction'
import {
  isParametricVariationType,
  transformVariations,
  variationTypes,
} from '@/flame/variations'
import { AutoCanvas } from '@/lib/AutoCanvas'
import { Camera2D } from '@/lib/Camera2D'
import { Root } from '@/lib/Root'
import { DelayedShow } from '../DelayedShow/DelayedShow'
import ui from '../LoadFlameModal/LoadFlameModal.module.css'
import { useRequestModal } from '../Modal/ModalContext'
import { ModalTitleBar } from '../Modal/ModalTitleBar'
import type { FlameDescriptor } from '@/flame/schema/flameSchema'
import type { TransformVariationDescriptor } from '@/flame/variations'
import type { ChangeHistory } from '@/utils/createStoreHistory'

const CANCEL = 'cancel'

function Preview(props: { transformVariation: TransformVariationDescriptor }) {
  const flameDesc: FlameDescriptor = {
    metadata: {
      author: 'person',
    },
    renderSettings: {
      skipIters: 20,
      camera: {
        zoom: 1,
        position: [0, 0],
      },
      exposure: 0.5,
      drawMode: 'light',
    },
    transforms: {
      [tid('d2523f69_dd2d_49cb_b14f_d9448e0bfb31')]: {
        probability: 1,
        preAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
        postAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
        color: { x: 0.8, y: 0.6 },
        variations: {
          [vid('bc571c35_0b03_4865_a765_d00cd71031a6')]: {
            type: 'linear',
            weight: 0.5,
          },
          [generateVariationId()]: { ...props.transformVariation },
        },
      },
    },
  }
  return (
    <Root adapterOptions={{ powerPreference: 'high-performance' }}>
      <AutoCanvas pixelRatio={1}>
        <Camera2D
          position={vec2f(...flameDesc.renderSettings.camera.position)}
          zoom={flameDesc.renderSettings.camera.zoom}
        >
          <Flam3
            quality={0.99}
            pointCountPerBatch={2e4}
            adaptiveFilterEnabled={true}
            flameDescriptor={flameDesc}
            renderInterval={1}
            onExportImage={undefined}
            edgeFadeColor={vec4f(0)}
          />
        </Camera2D>
      </AutoCanvas>
    </Root>
  )
}

type VariationSelectorModalProps = {
  respond: (flameDescriptor: FlameDescriptor | typeof CANCEL) => void
}

function ShowVariationSelector(props: VariationSelectorModalProps) {
  const previewVariations: TransformVariationDescriptor[] = variationTypes.map(
    (name) => ({
      type: name,
      weight: 0.5,
      params: isParametricVariationType(name)
        ? transformVariations[name].paramDefaults
        : undefined,
    }),
  )

  return (
    <>
      <ModalTitleBar
        onClose={() => {
          props.respond(CANCEL)
        }}
      >
        Select Variation
        <span class={ui.undoMessage}>You can undo this operation.</span>
      </ModalTitleBar>
      <h2>Example Gallery</h2>
      <section class={ui.gallery}>
        <For each={previewVariations}>
          {(variation, i) => (
            <button
              class={ui.item}
              onClick={() => {
                // todo: add flame descriptor update / modify sent one
                props.respond(CANCEL)
              }}
            >
              <DelayedShow delayMs={i() * 30}>
                <Preview transformVariation={variation} />
              </DelayedShow>
              <div class={ui.itemTitle}>{variation.type}</div>
            </button>
          )}
        </For>
      </section>
    </>
  )
}

export function createVariationSelector(
  history: ChangeHistory<FlameDescriptor>,
) {
  const requestModal = useRequestModal()
  const [varSelectorModalIsOpen, setVarSelectorModalIsOpen] =
    createSignal(false)

  async function showVariationSelector() {
    setVarSelectorModalIsOpen(true)
    const result = await requestModal<FlameDescriptor | typeof CANCEL>({
      content: ({ respond }) => <ShowVariationSelector respond={respond} />,
    })
    setVarSelectorModalIsOpen(false)
    if (result === CANCEL) {
      return
    }
    // structuredClone required in order to not modify the original, as store in solidjs does
    history.replace(structuredClone(result))
  }

  return {
    showVariationSelector,
    varSelectorModalIsOpen,
  }
}
