import { Command, flags } from '@oclif/command'; // tslint:disable-line no-unused-variable

import { pushStage } from '../config/fs';
import { Option } from '../environment';
import { stageFlag, WithStageFlag } from '../flags/stage';

/**
 * A command that is executed for each stage passed as an argument in flags
 * (`F`).
 * @param A type parameter for Args
 * @param F type parameter for Flags
 * @param T type parameter for the result of `#runOnStage`.
 */
export abstract class StageActorCommand<
  A,
  F extends WithStageFlag,
  T
> extends Command {
  static flags = {
    stage: stageFlag,
  };

  /**
   * Parses out flags (`F`) and args (`A`) and calls the abstract `#runOnStage`
   * method for each stage found in flags.
   * @see #runOnStage
   */
  async run() {
    const { args, flags } = this.parse<F, A>();
    const stages = flags.stage;
    // Despite what the inferred signature of `flags` indicates `stage` can be undefined
    if (stages === undefined || stages.length === 0) {
      this.error('At least one stage is required for `var:del`.', { exit: 1 });
      return;
    }
    const results = await Promise.all(
      stages.map(stage => this.actOnStage(stage, args, flags))
    );
    if (results.some(result => result === undefined)) {
      this.exit(1);
    }
  }

  /**
   * Perform this action for each `stage` provided in `flags` (`F`).
   * @param stage to execute an action for.
   * @param args parsed for this execution.
   * @param flags parsed for this execution.
   * @returns `undefined` if there was an error running on the given `stage`, a
   *    `T` indicating success.
   */
  abstract runOnStage(stage: string, args: A, flags: F): Promise<Option<T>>;

  /**
   * Executed for each `stage`, ensures the given `stage` is in project config
   * before executing `#runOnStage`.
   * @param stage to execute an action for.
   * @param args parsed for this execution.
   * @param flags parsed for this execution.
   * @returns `undefined` if there was an error running on the given `stage`, a
   *    `T` indicating success.
   */
  private async actOnStage(stage: string, args: A, flags: F) {
    try {
      await pushStage(stage);
    } catch (pushError) {
      this.error(`Book keeping - failed to save ${stage} to project config.`);
    }
    return this.runOnStage(stage, args, flags);
  }
}
