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
import {
  getParamsEditor,
  getVariationDefault,
  getVariationPreviewFlame,
} from '@/flame/variations/utils'
import { AutoCanvas } from '@/lib/AutoCanvas'
import { Camera2D } from '@/lib/Camera2D'
import { Root } from '@/lib/Root'
import { DelayedShow } from '../DelayedShow/DelayedShow'
import ui from './VariationSelector.module.css'
import { useRequestModal } from '../Modal/ModalContext'
import { ModalTitleBar } from '../Modal/ModalTitleBar'
import type {
  FlameDescriptor,
  TransformFunction,
} from '@/flame/schema/flameSchema'
import type {
  TransformVariationDescriptor,
  TransformVariationType,
} from '@/flame/variations'
import type { ChangeHistory } from '@/utils/createStoreHistory'
import { AffineParams } from '@/flame/affineTranform'

const CANCEL = 'cancel'

function Preview(props: { flame: FlameDescriptor }) {
  console.info(props.flame)
  return (
    <Root adapterOptions={{ powerPreference: 'high-performance' }}>
      <AutoCanvas pixelRatio={1}>
        <Camera2D
          position={vec2f(...props.flame.renderSettings.camera.position)}
          zoom={props.flame.renderSettings.camera.zoom}
        >
          {/* <Show */}
          {/*   when={isParametricVariation(props.variation) && props.variation} */}
          {/*   keyed */}
          {/* > */}
          {/*   {(variation) => ( */}
          {/*     <Dynamic */}
          {/*       {...getParamsEditor(variation)} */}
          {/*       setValue={(value) => { */}
          {/*         const variationDraft = */}
          {/*           props.flame.transforms[transformId]?.variations[variationId] */}
          {/*         if ( */}
          {/*           variationDraft === undefined || */}
          {/*           !isParametricVariation(variationDraft) */}
          {/*         ) { */}
          {/*           throw new Error(`Unreachable code`) */}
          {/*         } */}
          {/*         variationDraft.params = value */}
          {/*       }} */}
          {/*     /> */}
          {/*   )} */}
          {/* </Show> */}
          <Flam3
            quality={0.99}
            pointCountPerBatch={4e5}
            adaptiveFilterEnabled={false}
            flameDescriptor={props.flame}
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
  currentFlame: FlameDescriptor
  respond: (variation: TransformVariationDescriptor | typeof CANCEL) => void
}

function ShowVariationSelector(props: VariationSelectorModalProps) {
  const variationPreviewFlames: FlameDescriptor[] = variationTypes.map((name) =>
    getVariationPreviewFlame(name),
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
      <h2>Variation Gallery</h2>
      <section class={ui.variationPreview}>
        <section class={ui.gallery}>
          <For each={variationPreviewFlames}>
            {(variationPreviewFlame, i) => {
              const variation = Object.values(
                Object.values(variationPreviewFlame.transforms)[0]!.variations,
              )[0]
              return (
                variation && (
                  <button
                    class={ui.item}
                    onClick={() => {
                      props.respond(variation)
                    }}
                  >
                    <DelayedShow delayMs={i() * 30}>
                      <Preview flame={variationPreviewFlame} />
                    </DelayedShow>
                    <div class={ui.itemTitle}>{variation.type}</div>
                  </button>
                )
              )
            }}
          </For>
        </section>
        <section>
          <Preview flame={props.currentFlame} />
        </section>
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
    currentFlame: FlameDescriptor,
  ) {
    setVarSelectorModalIsOpen(true)
    const result = await requestModal<
      TransformVariationDescriptor | typeof CANCEL
    >({
      content: ({ respond }) => (
        <ChangeHistoryContextProvider value={history}>
          <ShowVariationSelector
            currentVar={currentVar}
            currentFlame={currentFlame}
            respond={respond}
          />
        </ChangeHistoryContextProvider>
      ),
    })
    setVarSelectorModalIsOpen(false)
    if (result === CANCEL) {
      return
    }
    return result
  }

  return {
    showVariationSelector,
    varSelectorModalIsOpen,
  }
}
