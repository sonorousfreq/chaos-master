import { createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { vec2f, vec4f } from 'typegpu/data'
import { ChangeHistoryContextProvider } from '@/contexts/ChangeHistoryContext'
import { Flam3 } from '@/flame/Flam3'
import {
  generateTransformId,
  generateVariationId,
} from '@/flame/transformFunction'
import { isParametricVariation, variationTypes } from '@/flame/variations'
import { getParamsEditor, getVariationDefault } from '@/flame/variations/utils'
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

function Preview(props: { variation: TransformVariationDescriptor }) {
  const tid = generateTransformId()
  const vid = generateVariationId()
  const flameDesc: FlameDescriptor = {
    metadata: {
      author: 'person',
    },
    renderSettings: {
      skipIters: 1,
      camera: {
        zoom: 1,
        position: [0, 0],
      },
      exposure: 0.3,
      drawMode: 'light',
    },
    transforms: {
      [tid]: {
        probability: 1,
        preAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
        postAffine: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 },
        color: { x: 1, y: 0.4 },
        variations: {
          // [vid('bc571c35_0b03_4865_a765_d00cd71031a6')]: {
          //   type: 'linear',
          //   weight: 0.5,
          // },
          [vid]: { ...props.variation },
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
          <Show
            when={isParametricVariation(props.variation) && props.variation}
            keyed
          >
            {(variation) => (
              <Dynamic
                {...getParamsEditor(variation)}
                setValue={(value) => {
                  const variationDraft =
                    flameDesc.transforms[tid]?.variations[vid]
                  if (
                    variationDraft === undefined ||
                    !isParametricVariation(variationDraft)
                  ) {
                    throw new Error(`Unreachable code`)
                  }
                  variationDraft.params = value
                }}
              />
            )}
          </Show>
          <Flam3
            quality={0.99}
            pointCountPerBatch={4e5}
            adaptiveFilterEnabled={false}
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
  currentVar: TransformVariationDescriptor
  respond: (variation: TransformVariationDescriptor | typeof CANCEL) => void
}

function ShowVariationSelector(props: VariationSelectorModalProps) {
  const previewVariations: TransformVariationDescriptor[] = variationTypes.map(
    (name) => getVariationDefault(name, 1),
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
                props.respond(variation)
              }}
            >
              <DelayedShow delayMs={i() * 30}>
                <Preview variation={variation} />
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

  async function showVariationSelector(
    currentVar: TransformVariationDescriptor,
  ) {
    setVarSelectorModalIsOpen(true)
    const result = await requestModal<
      TransformVariationDescriptor | typeof CANCEL
    >({
      content: ({ respond }) => (
        <ChangeHistoryContextProvider value={history}>
          <ShowVariationSelector currentVar={currentVar} respond={respond} />
        </ChangeHistoryContextProvider>
      ),
    })
    setVarSelectorModalIsOpen(false)
    if (result === CANCEL) {
      return
    }
    return result
    // structuredClone required in order to not modify the original, as store in solidjs does
    // history.replace(structuredClone(result))
  }

  return {
    showVariationSelector,
    varSelectorModalIsOpen,
  }
}
