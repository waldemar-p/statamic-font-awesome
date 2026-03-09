<template>
    <div class="flex icon-fieldtype-wrapper" v-if="icons">
        <Combobox
            ref="input"
            class="w-full"
            clearable
            :disabled="config.disabled"
            :read-only="isReadOnly"
            :options="filtered"
            :placeholder="config.placeholder || 'Search ...'"
            :searchable="true"
            :ignore-filter="true"
            :multiple="false"
            :close-on-select="true"
            :model-value="value"
            option-value="class"
            @update:model-value="vueSelectUpdated"
            @search="onSearch"
        >
            <template #option="icon">
                <div class="flex items-center">
                    <i class="flex items-center w-5 h-5" :class="icon.class" />
                    <span class="ml-4 text-xs truncate">{{ icon.label }}</span>
                </div>
            </template>

            <template #selected-option="{ option: icon }">
                <div class="flex items-center">
                    <i class="flex items-center w-5 h-5" :class="icon.class" />
                    <span class="ml-4 text-xs truncate">{{ icon.label }}</span>
                </div>
            </template>
        </Combobox>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Fieldtype } from '@statamic/cms';
import { Combobox } from '@statamic/cms/ui';
import { useFontAwesomeStore } from './store';

const emit = defineEmits([...Fieldtype.emits, 'focus', 'blur']);
const props = defineProps(Fieldtype.props);
const { expose, update, isReadOnly } = Fieldtype.use(emit, props);

defineExpose(expose);

const input = ref(null);
const search = ref('');
const limit = ref(50);

let viewport = null;
let observer = null;

const store = useFontAwesomeStore();

const icons = computed(() => store.icons);

const filteredAll = computed(() => {
    if (!icons.value) return [];
    const byStyle = icons.value.filter((icon) => props.meta.styles.includes(icon.style));
    if (search.value.length > 0) {
        return byStyle.filter((icon) => icon.label.toLowerCase().includes(search.value.toLowerCase()));
    }
    return byStyle;
});

const filtered = computed(() => filteredAll.value.slice(0, limit.value));


const fontAwesomeIsLoaded = computed(() => {
    const elements = props.meta.script
        ? Array.from(document.getElementsByTagName("script"))
            .filter(script => script.src === props.meta.script)
        : Array.from(document.getElementsByTagName("link"))
            .filter(link => link.href === props.meta.css);
    return elements.length > 0;
});

function focus() {
    input.value?.focus();
}

function vueSelectUpdated(value) {
    update(value || null);
}

function onSearch(query) {
    search.value = query;
    limit.value = 50;
}

function setupObserver() {
    observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    const vp = node.querySelector?.('[data-reka-combobox-viewport]') ||
                               (node.matches?.('[data-reka-combobox-viewport]') ? node : null);
                    if (vp && !viewport) {
                        viewport = vp;
                        viewport.addEventListener('scroll', handleScroll, { passive: true });
                        emit('focus');
                    }
                }
            }
            for (const node of mutation.removedNodes) {
                if (node.nodeType === 1 && viewport) {
                    const vp = node.querySelector?.('[data-reka-combobox-viewport]') ||
                               (node.matches?.('[data-reka-combobox-viewport]') ? node : null);
                    if (vp || node.contains?.(viewport)) {
                        viewport.removeEventListener('scroll', handleScroll);
                        viewport = null;
                        limit.value = 50;
                        emit('blur');
                    }
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function handleScroll() {
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (nearBottom && limit.value < filteredAll.value.length) {
        limit.value += 50;
    }
}

function loadFontAwesomeScript() {
    if (fontAwesomeIsLoaded.value) return;

    let externalScript = document.createElement('script');
    externalScript.setAttribute('src', props.meta.script);
    document.head.appendChild(externalScript);
}

function loadFontAwesomeCss() {
    if (fontAwesomeIsLoaded.value) return;

    let link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', props.meta.css);
    document.head.appendChild(link);
}

onMounted(() => {
    if (!store.icons) {
        store.fetchIcons();
    }
    props.meta.script ? loadFontAwesomeScript() : loadFontAwesomeCss();
    setupObserver();
});

onUnmounted(() => {
    observer?.disconnect();
    if (viewport) {
        viewport.removeEventListener('scroll', handleScroll);
    }
});
</script>
