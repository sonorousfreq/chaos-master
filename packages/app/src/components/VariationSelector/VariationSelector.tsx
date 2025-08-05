import { createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { vec2f, vec4f } from 'typegpu/data'
import { ChangeHistoryContextProvider } from '@/contexts/ChangeHistoryContext'
import { Flam3 } from '@/flame/Flam3'
import { isParametricVariation, variationTypes } from '@/flame/variations'
import {
  getParamsEditor,
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
  TransformId,
  VariationId,
} from '@/flame/schema/flameSchema'
import type { TransformVariationDescriptor } from '@/flame/variations'
import type { ChangeHistory } from '@/utils/createStoreHistory'
import { useKeyboardShortcuts } from '@/utils/useKeyboardShortcuts'
import { recordEntries } from '@/utils/record'

const CANCEL = 'cancel'

function Preview(props: { flame: FlameDescriptor }) {
  return (
    <Root adapterOptions={{ powerPreference: 'high-performance' }}>
      <AutoCanvas pixelRatio={1}>
        <Camera2D
          position={vec2f(...props.flame.renderSettings.camera.position)}
          zoom={props.flame.renderSettings.camera.zoom}
        >
          <Flam3
            quality={0.99}
            pointCountPerBatch={4e5}
            adaptiveFilterEnabled={false}
            flameDescriptor={props.flame}
            renderInterval={10}
            onExportImage={undefined}
            edgeFadeColor={vec4f(0)}
          />
        </Camera2D>
      </AutoCanvas>
    </Root>
  )
}
type respondType = {
  transform: TransformFunction | typeof CANCEL
  variation: TransformVariationDescriptor | typeof CANCEL
}
type VariationSelectorModalProps = {
  currentVar: TransformVariationDescriptor
  currentFlame: FlameDescriptor
  transformId: TransformId
  variationId: VariationId
  respond: (value: respondType) => void
}

function ShowVariationSelector(props: VariationSelectorModalProps) {
  const variationPreviewFlames: Record<string, FlameDescriptor> =
    Object.fromEntries(
      variationTypes.map((name) => [name, getVariationPreviewFlame(name)]),
    )
  const [variationExamples, setVariationExamples] = createSignal<
    Record<string, FlameDescriptor>
  >(variationPreviewFlames)
  const [showcaseItem, setShowcaseItem] = createSignal<
    FlameDescriptor | undefined
  >(undefined)
  const [itemId, setItemId] = createSignal<string | null>(null)

  const variationPreviewFlame = () => {
    const selectedItem = showcaseItem()
    if (selectedItem !== undefined) {
      const [transform, variation] = getTransformFromPreviewFlame(selectedItem)
      const clone = structuredClone(props.currentFlame)
      const previewTransform = clone.transforms[props.transformId]
      if (
        transform !== undefined &&
        variation !== undefined &&
        previewTransform !== undefined
      ) {
        previewTransform.preAffine = transform.preAffine
        previewTransform.variations[props.variationId] = variation
        return clone
      }
      return clone
    }
    return props.currentFlame
  }
  const getVarFromPreviewFlame = (flame: FlameDescriptor) => {
    return getTransformFromPreviewFlame(flame)[1]
  }
  const getTransformFromPreviewFlame = (
    flame: FlameDescriptor,
  ): [
    TransformFunction | undefined,
    TransformVariationDescriptor | undefined,
  ] => {
    const transform = Object.values(flame.transforms)[0]
    if (transform !== undefined) {
      const variation = Object.values(transform.variations)[0]
      if (variation !== undefined) {
        return [transform, variation]
      }
    }
    return [undefined, undefined]
  }
  useKeyboardShortcuts({
    Enter: () => {
      const variationFlame = showcaseItem()
      if (itemId() !== null && variationFlame !== undefined) {
        const [transform, variation] =
          getTransformFromPreviewFlame(variationFlame)
        if (transform !== undefined && variation !== undefined) {
          props.respond({ transform, variation })
        }
      }
      return true
    },
  })
  return (
    <>
      <ModalTitleBar
        onClose={() => {
          props.respond({ transform: CANCEL, variation: CANCEL })
        }}
      >
        Select Variation
        <span class={ui.undoMessage}>You can undo this operation.</span>
      </ModalTitleBar>
      <h2>Variation Gallery</h2>
      <section class={ui.variationPreview}>
        <section class={ui.gallery}>
          <For each={recordEntries(variationExamples())}>
            {([id, variationExample], i) => {
              const variation = getVarFromPreviewFlame(variationExample)
              return (
                variation && (
                  <div>
                    <button
                      class={ui.item}
                      classList={{
                        [ui.selected]: itemId() === id,
                      }}
                      onClick={() => {
                        setShowcaseItem(
                          showcaseItem() === undefined
                            ? variationExample
                            : undefined,
                        )
                        setItemId(id)
                      }}
                      // onMouseEnter={() =>
                      //   setShowcaseItem(variationPreviewFlame)
                      // }
                      // onMouseLeave={() => setShowcaseItem(undefined)}
                    >
                      <DelayedShow delayMs={i() * 30}>
                        <Preview flame={variationExample} />
                      </DelayedShow>
                      <div class={ui.itemTitle}>{variation.type}</div>
                    </button>
                    <div class={ui.itemParams}>
                      <Show
                        when={isParametricVariation(variation) && variation}
                        keyed
                      >
                        {(variation) => (
                          <Dynamic
                            {...getParamsEditor(variation)}
                            setValue={(value) => {
                              variation.params = value
                            }}
                          />
                        )}
                      </Show>
                    </div>
                  </div>
                )
              )
            }}
          </For>
        </section>
        <section class={ui.variationModifierPreview}>
          <Preview flame={variationPreviewFlame()} />
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
    tid: TransformId,
    vid: VariationId,
  ) {
    setVarSelectorModalIsOpen(true)
    const result = await requestModal<respondType>({
      class: ui.modalNoScroll,
      content: ({ respond }) => (
        <ChangeHistoryContextProvider value={history}>
          <ShowVariationSelector
            currentVar={currentVar}
            currentFlame={currentFlame}
            transformId={tid}
            variationId={vid}
            respond={respond}
          />
        </ChangeHistoryContextProvider>
      ),
    })
    setVarSelectorModalIsOpen(false)
    if (result.transform === CANCEL || result.variation === CANCEL) {
      return
    }
    return result
  }

  return {
    showVariationSelector,
    varSelectorModalIsOpen,
  }
}
