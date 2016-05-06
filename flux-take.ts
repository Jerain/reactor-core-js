import * as rs from './reactivestreams-spec';
import * as flow from './flow';
import * as sp from './subscription';

export class FluxTakeSubscriber<T> implements rs.Subscriber<T>, rs.Subscription {
    private mActual: rs.Subscriber<T>;
    private mRemaining : number;
    private once : boolean;
    private s: rs.Subscription;
    private done: boolean;
    
    constructor(n: number, actual: rs.Subscriber<T>) {
        this.mActual = actual;
        this.mRemaining = n;
        this.once = false;
        this.done = false;
    }
    
    onSubscribe(s: rs.Subscription) : void {
        if (sp.SH.validSubscription(this.s, s)) {
            this.s = s;
            this.mActual.onSubscribe(this);
        }
    }
    
    onNext(t: T) {
        if (this.done) {
            return;
        }
        
        var r = this.mRemaining;
        
        if (r == 0) {
            this.done = true;
            this.s.cancel();
            this.mActual.onComplete();
            return;
        }
        r--;
        
        this.mActual.onNext(t);
        
        if (r == 0 && !this.done) {
            this.done = true;
            this.s.cancel();
            this.mActual.onComplete();
            return;
        }
        
    }
    
    onError(t: Error) {
        if (this.done) {
            console.log(t);
            return;
        }
        this.done = true;
        this.mActual.onError(t);
    }
    
    onComplete() {
        if (this.done) {
            return;
        }
        this.done = true;
        this.mActual.onComplete();
    }
    
    request(n: number) : void {
        if (sp.SH.validRequest(n)) {
            if (!this.once) {
                this.once = true;
                if (n >= this.mRemaining) {
                    this.s.request(Infinity);
                    return;
                }
            }
            this.s.request(n);
        }
    }
    
    cancel() {
        this.s.cancel();
    }
}