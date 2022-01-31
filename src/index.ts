import { ContentfulClientApi, createClient, CreateClientParams } from "contentful";
import type { BackendModule, InitOptions, ReadCallback, ResourceKey, Services } from 'i18next';

interface ContentSchemaOptions {
    contentType: string;
    entryKeyAccessor: string;
    entryValueAccessor: string;
}

export interface i18nextContentfulBackendOptions extends ContentSchemaOptions {
    clientParams: CreateClientParams;
}

class i18nextContentfulBackend implements BackendModule<i18nextContentfulBackendOptions> {
    private contentfulClient: ContentfulClientApi | undefined = undefined;
    type: "backend" = "backend";
    static defaultOptions: ContentSchemaOptions = {
        contentType: 'resource',
        entryKeyAccessor: 'key',
        entryValueAccessor: 'value',
    }
    private options: ContentSchemaOptions = i18nextContentfulBackend.defaultOptions;
    
    init(services: Services, backendOptions: i18nextContentfulBackendOptions, i18nextOptions: InitOptions ) {
        this.contentfulClient = createClient(backendOptions.clientParams);
        this.options = {
            ...this.options,
            ...backendOptions
        };
    }

    read(language: string, namespace: string, callback: ReadCallback): void {
        this.getTranslationsForLanguage(language).then((translations) => callback(null, translations));
    }

    private async getTranslationsForLanguage(language: string): Promise<ResourceKey> {
        if (typeof this.contentfulClient === 'undefined') {
            throw new Error('Contentful Backend attempted to load translation but the client hadn\'t been initialized yet.');
        }
        const { items: translationEntries } = await this.contentfulClient.getEntries<Record<string, string>>({
            content_type: this.options.contentType,
            locale: language,
        });
        const obj: ResourceKey = {};
        translationEntries.forEach(({fields}) => {
            if (typeof fields[this.options.entryKeyAccessor] === "undefined") {
                throw new Error(`Could not find key ${this.options.entryKeyAccessor} in the response from Contentful. The keys we found were: ${Object.keys(fields).join(', ')}`);
            }
            if (typeof fields[this.options.entryValueAccessor] === "undefined") {
                throw new Error(`Could not find key ${this.options.entryValueAccessor} in the response from Contentful. The keys we found were ${Object.keys(fields).join(', ')}`);
            }
            obj[fields[this.options.entryKeyAccessor]] = fields[this.options.entryValueAccessor];
        });
        return obj;
    }
};

export default i18nextContentfulBackend;
