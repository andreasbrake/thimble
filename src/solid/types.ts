import $rdf from '@/solid/rdflib';

const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
const RDFS = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#');

const TERMS = $rdf.Namespace('http://purl.org/dc/terms/');
const STAT = $rdf.Namespace('http://www.w3.org/ns/posix/stat#');
const ELEMENTS = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
const SIOC = $rdf.Namespace('http://rdfs.org/sioc/ns#');
const LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
const VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const PIM = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
const SOLID = $rdf.Namespace('http://www.w3.org/ns/solid/terms#');
const PLAIN = $rdf.Namespace('http://www.w3.org/ns/iana/media-types/text/plain#');

class Node {
  protected store: any;
  protected id: string;
  constructor (store: any, id: string) {
    this.store = store;
    this.id = id;
  }
  public async load () {
    await new $rdf.Fetcher(this.store)(this.id.split('#')[0]);
  }
  protected node (namespace: any, prop: any) {
    return this.store.any($rdf.sym(this.id), namespace(prop));

  }
  protected value (namespace: any, prop: any) {
    const node = this.store.any($rdf.sym(this.id), namespace(prop));
    if (!node) {
      return null;
    }
    return node.value;
  }
  protected values (namespace: any, prop: any) {
    return this.store.each(
      $rdf.sym(this.id),
      namespace(prop),
    ).map((x: any) => {
      if (x.termType === 'NamedNode') {
        const parts = x.value.split('/');
        return this.id + '/' + parts[parts.length - 1];
      }
      return x;
    });
  }
  get symNode () {
    const x = $rdf.sym(this.id);
    return {
      dir: x.dir(),
      site: x.site(),
      doc: x.doc(),
    };
  }
  get doc () {
    return this.store.match($rdf.sym(this.id), null, null, $rdf.sym(this.id).doc())
      .map((x: any) => {
        if (x.object.termType === 'NamedNode') {
          // console.log('expanding', x.object, x.object.site())
          const parts = x.object.value.split('/');
          const end = parts.splice(parts.length - 1, 1)[0];
          if (this.id.indexOf(parts.join('/')) === 0) {
            return this.id + '/' + end;
          }
        }
        return x.object.value;
      });
  }
}

export class Profile extends Node {
  get fn () { return this.value(VCARD, 'fn'); }
  get organization_name () { return this.value(VCARD, 'organization-name'); }
  get role () { return this.value(VCARD, 'role'); }
  get hasEmail () { return this.value(VCARD, 'hasEmail'); }
  get email () {
    const emailPath = this.hasEmail;
    if (emailPath) {
      const node = this.store.any($rdf.sym(emailPath), VCARD('value'));
      return node.value;
    } else {
      return null;
    }
  }
  get hasPhoto () { return this.value(VCARD, 'hasPhoto'); }

  get name () { return this.value(FOAF, 'name'); }

  get preferencesFile () { return this.value(PIM, 'preferencesFile'); }
  get storage () { return this.value(PIM, 'storage'); }

  get account () { return this.value(SOLID, 'account'); }
  get privateTypeIndex () { return this.value(SOLID, 'privateTypeIndex'); }
  get publicTypeIndex () { return this.value(SOLID, 'publicTypeIndex'); }
}

export class Folder extends Node {
  get modified () {
    return this.value(TERMS, 'modified');
  }
  get contents () {
    return this.values(LDP, 'contains');
  }
}

export class Data extends Node {
  get author () { return this.value(ELEMENTS, 'author'); }
  get created () { return this.value(ELEMENTS, 'created'); }
  get modified () { return this.value(ELEMENTS, 'modified'); }
  get content () { return this.value(SIOC, 'content'); }
}

export class Simple extends Node {
  get content () { return this.value(SIOC, 'content'); }
}
