import { prop, Typegoose, ModelType, InstanceType, instanceMethod } from 'typegoose';
import * as mongoose from 'mongoose';

const db = process.env.DATABASE_URL || 'mongodb://admin:admin69@ds219181.mlab.com:19181/mvp_mandy';
mongoose.connect(db);

class _MvpRecord extends Typegoose {
    @prop()
    Mvp_Name: string;

    @prop()
    Killed_At: Date;

    @prop()
    Map_Name: string;

    @prop()
    Killed_By: string;


    @instanceMethod
    /** this is in minutes */
    timeUntilSpawn() {
        const inMilliseconds = this.Killed_At.getTime() - new Date().getTime();
        return inMilliseconds / 60 / 1000;
    }
}

export const MvpRecord = new _MvpRecord().getModelForClass(_MvpRecord);

var rec =  new MvpRecord();
rec.Map_Name = 'test';
rec.Killed_By = 'dev';
rec.Killed_At = new Date();
rec.Mvp_Name = 'mandy';

rec.save();